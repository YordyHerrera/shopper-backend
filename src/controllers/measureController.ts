import { Request, Response } from "express";
import { processImage } from "../services/geminiService";
import {
  checkDuplicateMeasure,
  saveMeasure,
  findMeasureByUUID,
  saveConfirmedMeasure,
  findMeasuresByCustomer,
} from "../models/measureModel";

// Interface atualizada
interface Measure {
  measure_uuid: string;
  customer_code: string;
  measure_type: string;
  measure_datetime: string;
  measure_value: number;
  image_url: string;
  has_confirmed: boolean;
  confirmed_value?: number;
}

// Função para fazer upload da medida
export const uploadMeasure = async (req: Request, res: Response) => {
  try {
    const { image, customer_code, measure_datetime, measure_type } = req.body;

    if (
      !image ||
      !customer_code ||
      !measure_datetime ||
      !["WATER", "GAS"].includes(measure_type)
    ) {
      return res.status(400).json({
        error_code: "INVALID_DATA",
        error_description: "Dados inválidos fornecidos.",
      });
    }

    const isDuplicate = await checkDuplicateMeasure(
      customer_code,
      measure_type,
      measure_datetime
    );
    if (isDuplicate) {
      return res.status(409).json({
        error_code: "DOUBLE_REPORT",
        error_description: "Leitura do mês já realizada.",
      });
    }

    const geminiResponse = await processImage(image);
    const { image_url, measure_value, measure_uuid } = geminiResponse;

    await saveMeasure(
      customer_code,
      measure_type,
      measure_value,
      measure_datetime,
      image_url,
      measure_uuid
    );

    return res.status(200).json({
      image_url,
      measure_value,
      measure_uuid,
    });
  } catch (error) {
    return res.status(500).json({
      error_code: "INTERNAL_SERVER_ERROR",
      error_description: "Ocorreu um erro ao processar a solicitação.",
    });
  }
};

// Função para confirmar a medida
export const confirmMeasure = async (req: Request, res: Response) => {
  try {
    const { measure_uuid, confirmed_value } = req.body;

    // Verifique se confirmed_value é fornecido e é um número
    if (
      !measure_uuid ||
      confirmed_value === undefined ||
      confirmed_value === null
    ) {
      return res.status(400).json({
        error_code: "INVALID_DATA",
        error_description: "Dados inválidos fornecidos.",
      });
    }

    const measure: Measure | null = await findMeasureByUUID(measure_uuid);
    if (!measure) {
      return res.status(404).json({
        error_code: "MEASURE_NOT_FOUND",
        error_description: "Leitura não encontrada.",
      });
    }
    if (measure.has_confirmed) {
      return res.status(409).json({
        error_code: "CONFIRMATION_DUPLICATE",
        error_description: "Leitura já confirmada.",
      });
    }

    // Verifique se a propriedade confirmed_value existe e é um número
    if (typeof confirmed_value !== "number") {
      return res.status(400).json({
        error_code: "INVALID_DATA",
        error_description: "Valor confirmado inválido.",
      });
    }

    measure.has_confirmed = true;
    measure.confirmed_value = confirmed_value;
    await saveConfirmedMeasure(measure);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error_code: "INTERNAL_SERVER_ERROR",
      error_description: "Ocorreu um erro ao processar a solicitação.",
    });
  }
};

// Função para listar medidas
export const listMeasures = async (req: Request, res: Response) => {
  try {
    const { customer_code } = req.params;
    const measure_type = req.query.measure_type as string | undefined;

    // Verifique se measure_type existe e é uma string antes de usar toUpperCase
    if (
      measure_type &&
      !["WATER", "GAS"].includes(measure_type.toUpperCase())
    ) {
      return res.status(400).json({
        error_code: "INVALID_TYPE",
        error_description: "Tipo de medição não permitida.",
      });
    }

    const measures = await findMeasuresByCustomer(
      customer_code,
      measure_type?.toUpperCase()
    );
    if (measures.length === 0) {
      return res.status(404).json({
        error_code: "MEASURES_NOT_FOUND",
        error_description: "Nenhuma leitura encontrada.",
      });
    }

    return res.status(200).json({
      customer_code,
      measures,
    });
  } catch (error) {
    return res.status(500).json({
      error_code: "INTERNAL_SERVER_ERROR",
      error_description: "Ocorreu um erro ao processar a solicitação.",
    });
  }
};
