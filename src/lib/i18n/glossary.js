// src/lib/i18n/glossary.js
// Definições do glossário por página, nos dois idiomas. `getGlossary(page, lang)`
// devolve a lista { term, description } pronta para o componente <Glossary>.
//
// Páginas cobertas: dict, chaves, municipio, transacoes (a Visão geral é uma
// landing não técnica e não recebe glossário).

const GLOSSARY = {
  dict: {
    pt: [
      {
        term: "DICT (Diretório de Identificadores de Contas Transacionais)",
        description:
          "Base de dados mantida pelo Banco Central que armazena o vínculo entre as chaves Pix e as contas transacionais dos usuários recebedores. É o componente do arranjo Pix que permite localizar a conta de destino a partir de uma chave, dispensando a troca manual de dados bancários.",
      },
      {
        term: "Usuário cadastrado no DICT",
        description:
          "Pessoa física ou jurídica que possui ao menos uma chave Pix registrada no DICT, vinculada a uma conta transacional em uma instituição participante do Pix.",
      },
      {
        term: "Pessoa física (PF)",
        description:
          "Usuários cadastrados no DICT identificados por CPF, ou que tenham vinculado ao menos uma chave (CPF, e-mail, celular ou chave aleatória) a uma conta de titularidade individual.",
      },
      {
        term: "Pessoa jurídica (PJ)",
        description:
          "Usuários cadastrados no DICT identificados por CNPJ, vinculados a contas transacionais de empresas ou outras entidades jurídicas.",
      },
      {
        term: "Chave Pix",
        description:
          "Apelido cadastrado no DICT (CPF/CNPJ, e-mail, número de celular ou chave aleatória) que identifica uma conta transacional específica, usado para iniciar pagamentos sem a necessidade de informar dados bancários completos.",
      },
    ],
    en: [
      {
        term: "DICT (Directory of Transactional Account Identifiers)",
        description:
          "A database maintained by the Central Bank that stores the link between Pix keys and the transactional accounts of receiving users. It is the component of the Pix scheme that lets a destination account be located from a key, removing the need to exchange banking details manually.",
      },
      {
        term: "User registered in the DICT",
        description:
          "An individual or business that holds at least one Pix key registered in the DICT, linked to a transactional account at a Pix-participating institution.",
      },
      {
        term: "Individual (PF)",
        description:
          "Users registered in the DICT identified by CPF (individual taxpayer ID), or who have linked at least one key (CPF, email, phone, or random key) to a personally held account.",
      },
      {
        term: "Business (PJ)",
        description:
          "Users registered in the DICT identified by CNPJ (business taxpayer ID), linked to transactional accounts of companies or other legal entities.",
      },
      {
        term: "Pix key",
        description:
          "An alias registered in the DICT (CPF/CNPJ, email, phone number, or random key) that identifies a specific transactional account, used to initiate payments without providing full banking details.",
      },
    ],
  },

  chaves: {
    pt: [
      {
        term: "Chave Pix",
        description:
          "Apelido que identifica uma conta transacional no DICT. Pode ser CPF, CNPJ, e-mail, número de celular ou uma chave aleatória gerada pelo sistema. Cada conta pode ter mais de uma chave, respeitados os limites por titular.",
      },
      {
        term: "Estoque de chaves",
        description:
          "Quantidade total de chaves Pix ativas registradas no DICT em um dado mês. É uma foto do acumulado, não um fluxo — reflete cadastros menos exclusões até a data de referência.",
      },
      {
        term: "Participante",
        description:
          "Instituição financeira ou de pagamento autorizada pelo Banco Central a oferecer o Pix e a registrar chaves no DICT em nome de seus clientes.",
      },
      {
        term: "Pessoa física (PF) / Pessoa jurídica (PJ)",
        description:
          "Classificação da titularidade da chave: PF corresponde a chaves de contas de pessoas físicas (identificadas por CPF); PJ, a chaves de contas de empresas e demais entidades (identificadas por CNPJ).",
      },
      {
        term: "Top 10 participantes",
        description:
          "Recorte dos dez maiores participantes por estoque de chaves no último mês disponível, usado para acompanhar a concentração e a evolução relativa das instituições ao longo do tempo.",
      },
    ],
    en: [
      {
        term: "Pix key",
        description:
          "An alias that identifies a transactional account in the DICT. It can be a CPF, CNPJ, email, phone number, or a system-generated random key. Each account may hold more than one key, subject to per-holder limits.",
      },
      {
        term: "Key stock",
        description:
          "The total number of active Pix keys registered in the DICT in a given month. It is a snapshot of the cumulative total, not a flow — it reflects registrations minus deletions up to the reference date.",
      },
      {
        term: "Participant",
        description:
          "A financial or payment institution authorized by the Central Bank to offer Pix and to register keys in the DICT on behalf of its customers.",
      },
      {
        term: "Individual (PF) / Business (PJ)",
        description:
          "Classification of key ownership: PF corresponds to keys on individuals' accounts (identified by CPF); PJ to keys on accounts of companies and other entities (identified by CNPJ).",
      },
      {
        term: "Top 10 participants",
        description:
          "A cut of the ten largest participants by key stock in the latest available month, used to track concentration and the relative evolution of institutions over time.",
      },
    ],
  },

  municipio: {
    pt: [
      {
        term: "Município (código IBGE)",
        description:
          "Unidade territorial de referência do dado. Cada município é identificado pelo seu código do IBGE, evitando ambiguidade entre municípios de mesmo nome em estados diferentes.",
      },
      {
        term: "Região",
        description:
          "Agrupamento das cinco grandes regiões do IBGE (Norte, Nordeste, Centro-Oeste, Sudeste e Sul), obtido pela agregação dos municípios de cada estado.",
      },
      {
        term: "Valor transacionado",
        description:
          "Soma, em reais, do valor das transações Pix liquidadas cujo pagador ou recebedor está no recorte geográfico selecionado, no período escolhido.",
      },
      {
        term: "Transações liquidadas",
        description:
          "Quantidade de transações Pix efetivamente concluídas no período, independentemente do valor. Complementa o valor transacionado para distinguir volume de ticket.",
      },
      {
        term: "Ranking",
        description:
          "Ordenação de municípios ou estados por valor ou por quantidade de transações, permitindo comparar a intensidade de uso do Pix entre localidades.",
      },
    ],
    en: [
      {
        term: "Municipality (IBGE code)",
        description:
          "The territorial reference unit of the data. Each municipality is identified by its IBGE code, avoiding ambiguity between municipalities with the same name in different states.",
      },
      {
        term: "Region",
        description:
          "Grouping into the five major IBGE regions (North, Northeast, Central-West, Southeast, and South), obtained by aggregating each state's municipalities.",
      },
      {
        term: "Transacted value",
        description:
          "The sum, in Brazilian reais, of the value of settled Pix transactions whose payer or receiver is in the selected geographic cut, over the chosen period.",
      },
      {
        term: "Settled transactions",
        description:
          "The number of Pix transactions actually completed in the period, regardless of amount. It complements transacted value to separate volume from ticket size.",
      },
      {
        term: "Ranking",
        description:
          "Ordering of municipalities or states by value or by transaction count, allowing comparison of Pix usage intensity across locations.",
      },
    ],
  },

  transacoes: {
    pt: [
      {
        term: "Natureza da transação",
        description:
          "Classificação do par pagador → recebedor por tipo de agente: P (pessoa), B (empresa/business) e G (governo). Assim, P2P é pessoa para pessoa, P2B é pessoa para empresa, e assim por diante.",
      },
      {
        term: "Finalidade",
        description:
          "Objetivo da operação: transferência comum, Pix Saque (retirada de dinheiro em espécie) ou Pix Troco (troco recebido em espécie numa compra).",
      },
      {
        term: "Forma de iniciação",
        description:
          "Como o pagamento foi disparado: chave Pix (DICT), QR Code estático ou dinâmico, inserção manual de dados, iniciador de pagamento, Pix automático ou aproximação.",
      },
      {
        term: "Região do pagador",
        description:
          "Grande região do IBGE em que está o pagador da transação, usada para compor a distribuição geográfica do fluxo.",
      },
      {
        term: "Ticket médio",
        description:
          "Valor transacionado dividido pela quantidade de transações no período. Indica o tamanho típico de uma transação, distinguindo muitas operações pequenas de poucas operações grandes.",
      },
    ],
    en: [
      {
        term: "Transaction nature",
        description:
          "Classification of the payer → receiver pair by agent type: P (person), B (business), and G (government). So P2P is person to person, P2B is person to business, and so on.",
      },
      {
        term: "Purpose",
        description:
          "The goal of the operation: an ordinary transfer, Pix Withdrawal (cash withdrawal), or Pix Cash back (change received in cash during a purchase).",
      },
      {
        term: "Initiation method",
        description:
          "How the payment was triggered: Pix key (DICT), static or dynamic QR code, manual data entry, payment initiator, automatic Pix, or contactless.",
      },
      {
        term: "Payer region",
        description:
          "The major IBGE region where the transaction's payer is located, used to build the geographic distribution of the flow.",
      },
      {
        term: "Average ticket",
        description:
          "Transacted value divided by the number of transactions in the period. It indicates the typical size of a transaction, distinguishing many small operations from a few large ones.",
      },
    ],
  },
};

export function getGlossary(page, lang) {
  const entry = GLOSSARY[page];
  if (!entry) return [];
  return entry[lang] ?? entry.pt ?? [];
}
