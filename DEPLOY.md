# Guia de Deploy na Vercel

Este projeto está otimizado para deploy na **Vercel**.

## 🚀 Como fazer o Deploy

### Opção 1: Via Interface Web (Recomendado para Iniciantes)
1. Faça push do seu código para um repositório no GitHub.
2. Acesse [vercel.com/new](https://vercel.com/new).
3. Importe o repositório do GitHub.
4. Na tela de configuração do projeto:
   - **Framework Preset**: Next.js (deve ser detectado automaticamente).
   - **Environment Variables**: Adicione as seguintes chaves:
     - `GEMINI_API_KEY`: Sua chave da API do Google Gemini.
     - `space_creators_api_key`: Sua chave da API ScrapeCreators.
5. Clique em **Deploy**.

### Opção 2: Via CLI (Linha de Comando)
Se você tiver a CLI da Vercel instalada (`npm i -g vercel`), basta rodar na raiz do projeto:

```bash
vercel
```

Siga as instruções na tela. Lembre-se de configurar as variáveis de ambiente no painel da Vercel após o deploy.

## ⚠️ Notas Importantes sobre Persistência de Dados

O sistema utiliza um arquivo JSON local (`data/profiles.json`) para armazenar o ranking dos perfis analisados.

Em ambientes Serverless como a Vercel:
- **O sistema de arquivos é temporário.**
- Para garantir que a aplicação não quebre, o código foi adaptado para usar o diretório temporário `/tmp` quando estiver em produção.
- **Consequência:** O histórico de rankings **será resetado** periodicamente (sempre que a instância do servidor for reiniciada ou redployada).
- Isso é aceitável para testes e demonstrações, mas para um produto final, recomenda-se migrar o armazenamento para um banco de dados real (como Vercel KV, Supabase ou MongoDB).

## Solução de Problemas

- **Erro 500 na Análise:** Verifique se as variáveis de ambiente (`GEMINI_API_KEY` e `space_creators_api_key`) foram configuradas corretamente no painel da Vercel.
- **Ranking Vazio:** Como explicado acima, isso é esperado após um novo deploy ou inatividade, pois os dados ficam em memória temporária.
