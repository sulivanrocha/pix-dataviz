// Cores por participante, mapeadas pelo nome exato como vem da API do BC
// (campo Nome em ChavesPix). A ideia é usar a cor de marca de cada instituição
// para que a mesma empresa tenha sempre a mesma cor — inclusive entre os
// painéis PF e PJ, que podem ter tops diferentes.
//
// Para ajustar: troque o hex ao lado do nome. Nomes não mapeados caem no
// fallback (paleta rotativa), então nada fica sem cor se um novo participante
// entrar no top 10 num refresh futuro.
//
// Famílias de cor próximas (Bradesco/Santander vermelhos, PicPay/Stone verdes,
// PicPay/Mercado Pago etc.) foram levemente afastadas para continuarem
// distinguíveis quando aparecem no mesmo painel.
const PARTICIPANT_COLORS = {
  "NU PAGAMENTOS - IP": "#820ad1", // Nubank roxo
  "PICPAY": "#21c25e", // PicPay verde
  "BCO BRADESCO S.A.": "#cc092f", // Bradesco vermelho
  "ITAÚ UNIBANCO S.A.": "#ec7000", // Itaú laranja
  "PAGSEGURO INTERNET IP S.A.": "#0fae79", // PagBank verde-água
  "CAIXA ECONOMICA FEDERAL": "#0070af", // Caixa azul
  "MERCADO PAGO IP LTDA.": "#00b1ea", // Mercado Pago azul-claro
  "BANCO INTER": "#ff7a00", // Inter laranja
  "BCO SANTANDER (BRASIL) S.A.": "#ea5c5c", // Santander vermelho (clareado p/ separar do Bradesco)
  "BCO DO BRASIL S.A.": "#f9dd16", // Banco do Brasil amarelo
  "BCO C6 S.A.": "#4a4a4a", // C6 grafite
  "STONE IP S.A.": "#0ab14e", // Stone verde
  "CLOUDWALK IP LTDA": "#2b59ff", // CloudWalk azul
};

// Fallback: mesma paleta rotativa usada nos outros gráficos, para nomes
// que não estão no mapa acima.
const FALLBACK = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
  "var(--seq-500)",
  "var(--accent-secondary)",
];

// Retorna a cor de marca do participante, ou uma cor estável de fallback
// baseada na posição (index) quando o nome não está mapeado.
export function participantColor(nome, index = 0) {
  return PARTICIPANT_COLORS[nome] ?? FALLBACK[index % FALLBACK.length];
}