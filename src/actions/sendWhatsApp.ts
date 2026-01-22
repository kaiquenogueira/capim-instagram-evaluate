'use server';

import axios from 'axios';

interface SendWhatsAppResponse {
  success: boolean;
  message?: string;
}

export async function sendWhatsAppWithAttachment(formData: FormData): Promise<SendWhatsAppResponse> {
  const phone = formData.get('phone') as string;
  const file = formData.get('file') as File;
  const perfil = formData.get('perfil')
  const webhookUrl = 'https://webhooks.n8n-sandbox.capim.tech/webhook/98bc423e-8132-4025-a902-3a9f385fcc20';

  if (!phone || !file) {
    return { success: false, message: 'Telefone e arquivo são obrigatórios' };
  }

  const user = process.env.send_email_user;
  const password = process.env.send_email_password;

  if (!user || !password) {
    console.error('Credenciais de envio não configuradas no servidor.');
    return { success: false, message: 'Erro de configuração no servidor' };
  }

  try {
    // Convert File to Buffer/Blob for axios
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const forwardFormData = new FormData();
    forwardFormData.append('phone', phone);
    forwardFormData.append('perfil', perfil as string);   

    // We need to create a Blob from the buffer to append to FormData in Node if we want to preserve filename
    const blob = new Blob([buffer], { type: file.type });
    forwardFormData.append('file', blob, 'relatorio.pdf');

    await axios.post(webhookUrl, forwardFormData, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64'),
        // Let axios/FormData set the Content-Type with boundary
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar WhatsApp via webhook:', error);
    if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro webhook:', error.response?.data);
        console.error('Status:', error.response?.status);
    }
    return { success: false, message: 'Falha ao enviar WhatsApp' };
  }
}
