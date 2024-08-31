import axios from "axios";

export const processImage = async (imageBase64: string) => {
  try {
    const response = await axios.post(
      "https://ai.google.dev/gemini-api/v1/process",
      {
        image: imageBase64,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
      }
    );

    return {
      image_url: response.data.image_url,
      measure_value: response.data.measure_value,
      measure_uuid: response.data.measure_uuid,
    };
  } catch (error) {
    throw new Error("Erro ao processar a imagem com o Google Gemini.");
  }
};
