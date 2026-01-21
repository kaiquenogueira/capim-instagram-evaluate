'use server';

import axios from 'axios';

interface SendEmailResponse {
  success: boolean;
  message?: string;
}

export async function sendEmailWithAttachment(formData: FormData): Promise<SendEmailResponse> {
  const email = formData.get('email') as string;
  const file = formData.get('file') as File;
  const webhookUrl = 'https://webhooks.workflows.capim.com.br/webhook/a8fb596c-25ee-4ecb-a53f-84ddc2810dbf';

  if (!email || !file) {
    return { success: false, message: 'Email e arquivo são obrigatórios' };
  }

  const user = process.env.send_email_user;
  const password = process.env.send_email_password;

  if (!user || !password) {
    console.error('Credenciais de envio de e-mail não configuradas no servidor.');
    return { success: false, message: 'Erro de configuração no servidor' };
  }

  try {
    // Convert File to Buffer/Blob for axios
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const apiFormData = new FormData();
    apiFormData.append('email', email);
      
    const forwardFormData = new FormData();
    forwardFormData.append('email', email);
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
    console.error('Erro ao enviar e-mail via webhook:', error);
    if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro webhook:', error.response?.data);
        console.error('Status:', error.response?.status);
    }
    return { success: false, message: 'Falha ao enviar e-mail' };
  }
}
