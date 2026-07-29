"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Bell,
  Boxes,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Gauge,
  History,
  LogOut,
  Menu,
  Minus,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackagePlus,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Page = "dashboard" | "produtos" | "retirada" | "entrada" | "movimentacoes" | "pedidos" | "usuarios";
type MovementType = "entrada" | "retirada";
type StockStatus = "normal" | "baixo" | "sem";
type Unidade = "SP" | "BH" | "PE" | "DF" | "JB" | "ION" | "EG";
const UNIDADES: Unidade[] = ["SP", "BH", "PE", "DF", "JB", "ION", "EG"];

type Product = {
  id: string; // linha de estoque (produto + unidade)
  produto_id: string;
  unidade: Unidade;
  referencia_produto: string;
  nome_produto: string;
  descricao: string;
  quantidade_atual: number;
  estoque_minimo: number;
  updated_at: string;
};

type UserStatus = "pendente" | "aprovado" | "rejeitado";

type User = {
  id: string;
  nome: string;
  email: string;
  perfil: "Administrador" | "Supervisor" | "Analista" | "Operador";
  status: UserStatus;
  unidades: Unidade[]; // vazio = acesso total (Administrador/Supervisor)
};

type Movement = {
  id: string;
  produto_id: string;
  usuario_id: string;
  unidade: Unidade;
  tipo_movimentacao: MovementType;
  quantidade: number;
  observacao: string;
  data_movimentacao: string;
  produto_nome: string;
  produto_referencia: string;
  usuario_nome: string;
};

type PedidoExtra = {
  id: string;
  usuario_id: string;
  usuario_nome: string;
  unidade: Unidade;
  descricao: string;
  quantidade: number;
  observacao: string;
  atendido: boolean;
  created_at: string;
};

const LOGO = "https://upload.wikimedia.org/wikipedia/commons/6/68/Xerox_logo.svg";

const seedProducts: Product[] = [
  { id: "e1", produto_id: "p1", unidade: "SP", referencia_produto: "006R04399", nome_produto: "Toner Preto VersaLink C7000", descricao: "Cartucho original de alta capacidade", quantidade_atual: 18, estoque_minimo: 5, updated_at: "2026-07-27T12:42:00-03:00" },
  { id: "e2", produto_id: "p2", unidade: "SP", referencia_produto: "006R01824", nome_produto: "Toner Ciano Alta Capacidade", descricao: "Suprimento para linha AltaLink C81xx", quantidade_atual: 4, estoque_minimo: 5, updated_at: "2026-07-27T11:18:00-03:00" },
  { id: "e3", produto_id: "p3", unidade: "SP", referencia_produto: "013R00681", nome_produto: "Unidade de Imagem", descricao: "Cilindro para VersaLink B70xx", quantidade_atual: 0, estoque_minimo: 2, updated_at: "2026-07-27T10:05:00-03:00" },
  { id: "e4", produto_id: "p4", unidade: "SP", referencia_produto: "008R13061", nome_produto: "Recipiente de Resíduos", descricao: "Coletor de toner para WorkCentre 78xx", quantidade_atual: 12, estoque_minimo: 4, updated_at: "2026-07-26T16:42:00-03:00" },
  { id: "e5", produto_id: "p5", unidade: "SP", referencia_produto: "115R00115", nome_produto: "Fusor 220V", descricao: "Módulo fusor para AltaLink B80xx", quantidade_atual: 2, estoque_minimo: 3, updated_at: "2026-07-26T15:27:00-03:00" },
  { id: "e6", produto_id: "p6", unidade: "SP", referencia_produto: "059K26570", nome_produto: "Kit Rolete de Alimentação", descricao: "Conjunto de roletes para bandeja", quantidade_atual: 26, estoque_minimo: 8, updated_at: "2026-07-26T14:11:00-03:00" },
  { id: "e7", produto_id: "p7", unidade: "SP", referencia_produto: "064K93623", nome_produto: "Correia de Transferência", descricao: "IBT Belt para Color C60/C70", quantidade_atual: 1, estoque_minimo: 2, updated_at: "2026-07-25T17:02:00-03:00" },
  { id: "e8", produto_id: "p8", unidade: "SP", referencia_produto: "008R12964", nome_produto: "Cartucho de Grampos", descricao: "Refil para finalizador profissional", quantidade_atual: 35, estoque_minimo: 10, updated_at: "2026-07-25T14:32:00-03:00" },
  { id: "e9", produto_id: "p1", unidade: "BH", referencia_produto: "006R04399", nome_produto: "Toner Preto VersaLink C7000", descricao: "Cartucho original de alta capacidade", quantidade_atual: 6, estoque_minimo: 5, updated_at: "2026-07-27T09:10:00-03:00" },
  { id: "e10", produto_id: "p2", unidade: "BH", referencia_produto: "006R01824", nome_produto: "Toner Ciano Alta Capacidade", descricao: "Suprimento para linha AltaLink C81xx", quantidade_atual: 0, estoque_minimo: 4, updated_at: "2026-07-26T18:20:00-03:00" },
  { id: "e11", produto_id: "p5", unidade: "BH", referencia_produto: "115R00115", nome_produto: "Fusor 220V", descricao: "Módulo fusor para AltaLink B80xx", quantidade_atual: 5, estoque_minimo: 2, updated_at: "2026-07-25T11:00:00-03:00" },
  { id: "e12", produto_id: "p6", unidade: "PE", referencia_produto: "059K26570", nome_produto: "Kit Rolete de Alimentação", descricao: "Conjunto de roletes para bandeja", quantidade_atual: 9, estoque_minimo: 6, updated_at: "2026-07-24T10:00:00-03:00" },
];

const seedUsers: User[] = [
  { id: "u1", nome: "Marcos Oliveira", email: "marcos@empresa.com.br", perfil: "Administrador", status: "aprovado", unidades: [] },
  { id: "u2", nome: "Amanda Costa", email: "amanda@empresa.com.br", perfil: "Analista", status: "aprovado", unidades: ["SP"] },
  { id: "u3", nome: "Rafael Santos", email: "rafael@empresa.com.br", perfil: "Operador", status: "aprovado", unidades: ["SP"] },
  { id: "u4", nome: "Carlos Mendes", email: "carlos@empresa.com.br", perfil: "Operador", status: "aprovado", unidades: ["BH", "PE"] },
  { id: "u5", nome: "Juliana Pereira", email: "juliana@empresa.com.br", perfil: "Operador", status: "pendente", unidades: [] },
  { id: "u6", nome: "Bianca Ramos", email: "bianca@empresa.com.br", perfil: "Supervisor", status: "aprovado", unidades: [] },
];

const seedMovements: Movement[] = [
  { id: "m1", produto_id: "p1", usuario_id: "u3", unidade: "SP", tipo_movimentacao: "retirada", quantidade: 2, observacao: "OS 2784 · Cliente Centro", data_movimentacao: "2026-07-27T12:42:00-03:00", produto_nome: "Toner Preto VersaLink C7000", produto_referencia: "006R04399", usuario_nome: "Rafael Santos" },
  { id: "m2", produto_id: "p2", usuario_id: "u2", unidade: "SP", tipo_movimentacao: "entrada", quantidade: 6, observacao: "NF 10458 · Reposição", data_movimentacao: "2026-07-27T11:18:00-03:00", produto_nome: "Toner Ciano Alta Capacidade", produto_referencia: "006R01824", usuario_nome: "Amanda Costa" },
  { id: "m3", produto_id: "p3", usuario_id: "u3", unidade: "SP", tipo_movimentacao: "retirada", quantidade: 1, observacao: "OS 2781 · Troca preventiva", data_movimentacao: "2026-07-27T10:05:00-03:00", produto_nome: "Unidade de Imagem", produto_referencia: "013R00681", usuario_nome: "Rafael Santos" },
  { id: "m4", produto_id: "p1", usuario_id: "u4", unidade: "BH", tipo_movimentacao: "retirada", quantidade: 1, observacao: "OS 1102", data_movimentacao: "2026-07-26T16:42:00-03:00", produto_nome: "Toner Preto VersaLink C7000", produto_referencia: "006R04399", usuario_nome: "Carlos Mendes" },
  { id: "m5", produto_id: "p5", usuario_id: "u2", unidade: "SP", tipo_movimentacao: "entrada", quantidade: 2, observacao: "Compra emergencial", data_movimentacao: "2026-07-26T15:27:00-03:00", produto_nome: "Fusor 220V", produto_referencia: "115R00115", usuario_nome: "Amanda Costa" },
];

const seedPedidos: PedidoExtra[] = [
  { id: "x1", usuario_id: "u3", usuario_nome: "Rafael Santos", unidade: "SP", descricao: "Cabo de força reserva para AltaLink", quantidade: 2, observacao: "Não é item de estoque padrão", atendido: false, created_at: "2026-07-25T09:00:00-03:00" },
];

const pageCopy: Record<Page, [string, string]> = {
  dashboard: ["Visão geral", "Acompanhe o estoque e as movimentações em tempo real."],
  produtos: ["Produtos", "Gerencie peças, suprimentos e níveis mínimos."],
  retirada: ["Nova retirada", "Registre a saída de um item em poucos segundos."],
  entrada: ["Nova entrada", "Registre a chegada de um item em poucos segundos."],
  movimentacoes: ["Histórico de movimentações", "Rastreabilidade completa de entradas e retiradas."],
  pedidos: ["Pedido extra do mês", "Solicitações avulsas que não ficam registradas no estoque."],
  usuarios: ["Usuários e acessos", "Consulte a equipe e os perfis de permissão."],
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function stockStatus(product: Product): StockStatus {
  if (product.quantidade_atual === 0) return "sem";
  if (product.quantidade_atual <= product.estoque_minimo) return "baixo";
  return "normal";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)).replace(".", "");
}

function stockStatusLabel(status: StockStatus) {
  return { normal: "Em estoque", baixo: "Estoque baixo", sem: "Sem estoque" }[status];
}

function hasFullAccess(user: User) {
  return user.perfil === "Administrador" || user.perfil === "Supervisor";
}

function unidadeLabelFor(unidade: Unidade | "todas") {
  return unidade === "todas" ? "Todas as unidades" : `Unidade ${unidade}`;
}

// Cada status tem dois tons: `Solid` preenche a célula do status (texto branco
// por cima) e `Row` faixeia a linha inteira — forte o bastante para saltar aos
// olhos, claro o bastante para não apagar o texto das demais colunas.
const XLSX_COLORS = {
  ink: "FF18191C", red: "FFD71920", muted: "FF888888", white: "FFFFFFFF",
  green: "FF0F7A50", greenSolid: "FF12805A", greenRow: "FFBFE5D2",
  yellow: "FF9A6004", yellowSolid: "FFB8730A", yellowRow: "FFFBDF9B",
  danger: "FFB81C27", dangerSolid: "FFC0212C", dangerRow: "FFF7C0C6",
  warnBg: "FFFFE7A0",
} as const;

const solidFill = (argb: string) => ({ type: "pattern", pattern: "solid", fgColor: { argb } }) as const;
const statusFont = { bold: true, color: { argb: XLSX_COLORS.white } } as const;

async function exportStockExcel(products: Product[], movements: Movement[], escopoLabel: string) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Service Hub";
  workbook.created = new Date();

  const out = products.filter((p) => stockStatus(p) === "sem").length;
  const low = products.filter((p) => stockStatus(p) === "baixo").length;
  const attention = products.filter((p) => stockStatus(p) !== "normal").sort((a, b) => a.quantidade_atual - b.quantidade_atual);

  const dash = workbook.addWorksheet("Dashboard", { properties: { tabColor: { argb: XLSX_COLORS.red } } });
  dash.columns = [{ width: 30 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 20 }];

  dash.mergeCells("A1:E1");
  const title = dash.getCell("A1");
  title.value = `Service Hub — Relatório de estoque (${escopoLabel})`;
  title.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_COLORS.ink } };
  title.alignment = { vertical: "middle" };
  dash.getRow(1).height = 32;

  dash.mergeCells("A2:E2");
  dash.getCell("A2").value = `Gerado em ${new Date().toLocaleString("pt-BR")}`;
  dash.getCell("A2").font = { italic: true, color: { argb: XLSX_COLORS.muted } };

  const kpis: [string, number, string][] = [
    ["Produtos cadastrados", products.length, XLSX_COLORS.ink],
    ["Estoque normal", products.length - out - low, XLSX_COLORS.green],
    ["Estoque baixo", low, XLSX_COLORS.yellow],
    ["Sem estoque", out, XLSX_COLORS.danger],
  ];
  kpis.forEach(([label, value, color], i) => {
    const col = String.fromCharCode(65 + i);
    const labelCell = dash.getCell(`${col}4`);
    labelCell.value = label;
    labelCell.font = { size: 9, color: { argb: XLSX_COLORS.muted } };
    labelCell.alignment = { horizontal: "center" };
    const valueCell = dash.getCell(`${col}5`);
    valueCell.value = value;
    valueCell.font = { size: 26, bold: true, color: { argb: color } };
    valueCell.alignment = { horizontal: "center" };
  });
  dash.getRow(5).height = 36;

  dash.getCell("A7").value = "Itens que precisam de atenção";
  dash.getCell("A7").font = { bold: true, size: 12 };
  const attentionHeader = ["Produto", "Referência", "Unidade", "Estoque", "Mínimo"];
  attentionHeader.forEach((h, i) => {
    const c = dash.getRow(8).getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_COLORS.ink } };
  });
  attention.forEach((p, i) => {
    const row = dash.getRow(9 + i);
    const sem = stockStatus(p) === "sem";
    row.getCell(1).value = p.nome_produto;
    row.getCell(2).value = p.referencia_produto;
    row.getCell(3).value = p.unidade;
    row.getCell(4).value = p.quantidade_atual;
    row.getCell(5).value = p.estoque_minimo;
    for (let col = 1; col <= 5; col += 1) row.getCell(col).fill = solidFill(sem ? XLSX_COLORS.dangerRow : XLSX_COLORS.yellowRow);
    row.getCell(4).fill = solidFill(sem ? XLSX_COLORS.dangerSolid : XLSX_COLORS.yellowSolid);
    row.getCell(4).font = statusFont;
  });
  if (!attention.length) dash.getCell("A9").value = "Nenhum item com estoque baixo ou zerado.";

  const stockSheet = workbook.addWorksheet("Estoque completo");
  stockSheet.columns = [
    { header: "Referência", key: "ref", width: 16 },
    { header: "Produto", key: "nome", width: 32 },
    { header: "Descrição", key: "desc", width: 36 },
    { header: "Unidade", key: "unidade", width: 12 },
    { header: "Quantidade atual", key: "qtd", width: 16 },
    { header: "Estoque mínimo", key: "min", width: 16 },
    { header: "Status", key: "status", width: 16 },
    { header: "Atualizado em", key: "upd", width: 20 },
  ];
  stockSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  stockSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_COLORS.ink } };
  stockSheet.autoFilter = "A1:H1";
  stockSheet.views = [{ state: "frozen", ySplit: 1 }];
  products.forEach((p) => {
    const status = stockStatus(p);
    const row = stockSheet.addRow({ ref: p.referencia_produto, nome: p.nome_produto, desc: p.descricao, unidade: p.unidade, qtd: p.quantidade_atual, min: p.estoque_minimo, status: stockStatusLabel(status), upd: dateLabel(p.updated_at) });
    // Só os itens que exigem ação recebem faixa na linha: pintar também os
    // normais deixaria a planilha inteira colorida e sem hierarquia.
    if (status !== "normal") {
      const faixa = solidFill(status === "sem" ? XLSX_COLORS.dangerRow : XLSX_COLORS.yellowRow);
      for (let col = 1; col <= 8; col += 1) row.getCell(col).fill = faixa;
    }
    row.getCell(7).fill = solidFill(status === "sem" ? XLSX_COLORS.dangerSolid : status === "baixo" ? XLSX_COLORS.yellowSolid : XLSX_COLORS.greenSolid);
    row.getCell(7).font = statusFont;
  });

  const movSheet = workbook.addWorksheet("Movimentações");
  movSheet.columns = [
    { header: "Data e hora", key: "data", width: 20 },
    { header: "Responsável", key: "user", width: 22 },
    { header: "Produto", key: "produto", width: 32 },
    { header: "Referência", key: "ref", width: 16 },
    { header: "Unidade", key: "unidade", width: 12 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Quantidade", key: "qtd", width: 14 },
    { header: "Observação", key: "obs", width: 30 },
  ];
  movSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  movSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_COLORS.ink } };
  movSheet.autoFilter = "A1:H1";
  movSheet.views = [{ state: "frozen", ySplit: 1 }];
  movements.forEach((m) => {
    const row = movSheet.addRow({ data: dateLabel(m.data_movimentacao), user: m.usuario_nome, produto: m.produto_nome, ref: m.produto_referencia, unidade: m.unidade, tipo: m.tipo_movimentacao === "entrada" ? "Entrada" : "Retirada", qtd: m.quantidade, obs: m.observacao || "—" });
    row.getCell(6).fill = solidFill(m.tipo_movimentacao === "entrada" ? XLSX_COLORS.greenSolid : XLSX_COLORS.dangerSolid);
    row.getCell(6).font = statusFont;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-estoque-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportChecklistExcel(products: Product[], escopoLabel: string) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Service Hub";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Checklist de conferência");
  sheet.columns = [{ width: 16 }, { width: 32 }, { width: 12 }, { width: 14 }, { width: 22 }, { width: 14 }, { width: 34 }];

  sheet.mergeCells("A1:G1");
  const title = sheet.getCell("A1");
  title.value = `Checklist de conferência de estoque — ${escopoLabel}`;
  title.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_COLORS.ink } };
  title.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 28;

  sheet.mergeCells("A2:G2");
  sheet.getCell("A2").value = `Gerado em ${new Date().toLocaleString("pt-BR")} · confira o físico e preencha a coluna "Qtd. física" antes de enviar ao Supervisor.`;
  sheet.getCell("A2").font = { italic: true, size: 9, color: { argb: XLSX_COLORS.muted } };

  const headers = ["Referência", "Produto", "Unidade", "Qtd. sistema", "Qtd. física (preencher)", "Diferença", "Observação"];
  headers.forEach((h, i) => {
    const c = sheet.getRow(4).getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XLSX_COLORS.ink } };
  });
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.autoFilter = "A4:G4";

  products.forEach((p, i) => {
    const rowNum = 5 + i;
    const row = sheet.getRow(rowNum);
    row.getCell(1).value = p.referencia_produto;
    row.getCell(2).value = p.nome_produto;
    row.getCell(3).value = p.unidade;
    row.getCell(4).value = p.quantidade_atual;
    row.getCell(5).value = null;
    row.getCell(5).fill = solidFill(XLSX_COLORS.warnBg);
    row.getCell(6).value = { formula: `IF(E${rowNum}="","",E${rowNum}-D${rowNum})` } as unknown as string;
    row.getCell(7).value = "";
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `checklist-estoque-${escopoLabel.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Brand() {
  return (
    <div className="brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="brand-logo"><img src={LOGO} alt="Xerox" /></span>
      <span className="brand-text"><b>Service Hub</b><small>Gestão de estoque</small></span>
    </div>
  );
}

function Badge({ status }: { status: StockStatus }) {
  const map = { normal: ["Em estoque", Check], baixo: ["Estoque baixo", AlertTriangle], sem: ["Sem estoque", XCircle] } as const;
  const [label, Icon] = map[status];
  return <span className={`badge badge-${status}`}><Icon size={18} />{label}</span>;
}

function Login({ onLogin, onSignup, onDemo, connected }: { onLogin: (email: string, password: string) => Promise<void>; onSignup: (nome: string, email: string, password: string) => Promise<void>; onDemo: () => void; connected: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (mode === "signup") {
      if (password !== confirm) { setError("As senhas não coincidem."); return; }
      setBusy(true);
      try {
        await onSignup(nome, email, password);
        setNotice("Cadastro enviado! Aguarde a aprovação do administrador para acessar o sistema.");
        setPassword(""); setConfirm(""); setNome("");
        setMode("login");
      } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir o cadastro."); }
      setBusy(false);
      return;
    }

    if (!connected) { setError("Configure o Supabase ou acesse a demonstração."); return; }
    setBusy(true);
    try { await onLogin(email, password); } catch (err) { setError(err instanceof Error ? err.message : "E-mail ou senha incorretos."); }
    setBusy(false);
  }

  return (
    <main className="login">
      <section className="login-hero">
        <Brand />
        <div className="hero-copy">
          <span>OPERAÇÃO TÉCNICA INTELIGENTE</span>
          <h1>Estoque preciso.<br />Serviço sem interrupções.</h1>
          <p>Controle peças e suprimentos Xerox com rastreabilidade total, alertas automáticos e lançamentos rápidos.</p>
        </div>
        <div className="hero-features">
          <span><ShieldCheck size={23} />Acesso seguro</span>
          <span><History size={23} />Histórico completo</span>
          <span><Gauge size={23} />Controle em tempo real</span>
        </div>
        <div className="hero-orbit"><span /><span /><div><PackageCheck size={27} /><small>Estoque atualizado</small><b>98,7%</b></div></div>
      </section>
      <section className="login-panel">
        <div className="login-mobile-brand"><Brand /></div>
        <form onSubmit={submit} className="login-form">
          <span className="secure"><ShieldCheck size={19} /> Ambiente protegido</span>
          <h2>{mode === "login" ? "Bem-vindo de volta" : "Criar cadastro"}</h2>
          <p>{mode === "login" ? "Entre com suas credenciais para acessar o sistema." : "Solicite acesso e aguarde a aprovação do administrador."}</p>
          {notice && <div className="form-notice">{notice}</div>}
          {mode === "signup" && <label><b>Nome completo</b><div className="login-input"><UserRound size={23} /><input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" required /></div></label>}
          <label><b>E-mail corporativo</b><div className="login-input"><UserRound size={23} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.com.br" required /></div></label>
          <label><b>Senha</b><div className="login-input"><ShieldCheck size={23} /><input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" required /><button type="button" onClick={() => setShow(!show)} aria-label="Mostrar senha">{show ? <EyeOff size={23} /> : <Eye size={23} />}</button></div></label>
          {mode === "signup" && <label><b>Confirmar senha</b><div className="login-input"><ShieldCheck size={23} /><input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" required /></div></label>}
          {mode === "login" && <div className="login-options"><label><input type="checkbox" /> Lembrar acesso</label><button type="button">Esqueci minha senha</button></div>}
          {error && <div className="form-error">{error}</div>}
          <button className="primary login-submit" disabled={busy}>{busy ? (mode === "login" ? "Entrando..." : "Enviando...") : (mode === "login" ? "Entrar no sistema" : "Solicitar cadastro")}<ArrowRight size={23} /></button>
          <div className="switch-mode"><span>{mode === "login" ? "Ainda não tem acesso?" : "Já tem uma conta?"}</span><button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Cadastre-se" : "Entrar"}</button></div>
          {mode === "login" && !connected && <><div className="or"><span>ou</span></div><button type="button" className="demo" onClick={onDemo}>Acessar demonstração<small>Sem configurar o Supabase</small></button></>}
        </form>
        <footer>© 2026 Service Hub · Uso interno</footer>
      </section>
    </main>
  );
}

function initialUnidade(user: User): Unidade | "todas" {
  if (hasFullAccess(user)) return "todas";
  return user.unidades[0] ?? "todas";
}

export default function Home() {
  const supabase = useMemo<SupabaseClient | null>(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return url && key ? createClient(url, key) : null;
  }, []);
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState<Page>("dashboard");
  const [menu, setMenu] = useState(false);
  const [products, setProducts] = useState(seedProducts);
  const [movements, setMovements] = useState(seedMovements);
  const [users, setUsers] = useState(seedUsers);
  const [pedidos, setPedidos] = useState(seedPedidos);
  const [currentUser, setCurrentUser] = useState<User>(seedUsers[0]);
  const [activeUnidade, setActiveUnidade] = useState<Unidade | "todas">("todas");
  const [editProduct, setEditProduct] = useState<Product | "new" | null>(null);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [approvingUser, setApprovingUser] = useState<User | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadData(client = supabase) {
    if (!client) return;
    const [p, m, u, pe] = await Promise.all([
      client.from("estoque_detalhado").select("*").order("nome_produto"),
      client.from("movimentacoes_detalhadas").select("*").order("data_movimentacao", { ascending: false }).limit(100),
      client.from("usuarios_com_unidades").select("*").order("nome"),
      client.from("pedidos_extras_detalhados").select("*").order("created_at", { ascending: false }),
    ]);
    if (p.data) setProducts(p.data as Product[]);
    if (m.data) setMovements(m.data as Movement[]);
    if (u.data) setUsers(u.data as User[]);
    if (pe.data) setPedidos(pe.data as PedidoExtra[]);
  }

  async function login(email: string, password: string) {
    if (!supabase) throw new Error("not configured");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      if (result.error.message === "Email not confirmed") throw new Error("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      throw new Error("E-mail ou senha incorretos.");
    }
    if (!result.data.user) throw new Error("E-mail ou senha incorretos.");
    const profile = await supabase.from("usuarios_com_unidades").select("*").eq("id", result.data.user.id).single();
    const account = profile.data as User | null;
    if (!account) throw new Error("E-mail ou senha incorretos.");
    if (account.status === "pendente") { await supabase.auth.signOut(); throw new Error("Seu cadastro está aguardando aprovação do administrador."); }
    if (account.status === "rejeitado") { await supabase.auth.signOut(); throw new Error("Cadastro não aprovado. Fale com o administrador."); }
    setCurrentUser(account);
    setActiveUnidade(initialUnidade(account));
    await loadData(supabase);
    setLogged(true);
  }

  async function signup(nome: string, email: string, password: string) {
    if (!supabase) {
      setUsers((items) => [{ id: crypto.randomUUID(), nome, email, perfil: "Operador", status: "pendente", unidades: [] }, ...items]);
      return;
    }
    const result = await supabase.auth.signUp({ email, password, options: { data: { nome } } });
    if (result.error) throw new Error(result.error.message);
  }

  async function saveUnidades(userId: string, unidades: Unidade[]) {
    if (!supabase) return;
    await supabase.from("usuarios_unidades").delete().eq("usuario_id", userId);
    if (unidades.length) await supabase.from("usuarios_unidades").insert(unidades.map((unidade) => ({ usuario_id: userId, unidade })));
  }

  async function approveUser(user: User, perfil: User["perfil"], unidades: Unidade[]) {
    if (supabase) {
      const upd = await supabase.from("users").update({ perfil, status: "aprovado" }).eq("id", user.id);
      if (upd.error) { setToast("Não foi possível aprovar o cadastro."); return; }
      await saveUnidades(user.id, unidades);
      await loadData();
    } else {
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, perfil, status: "aprovado", unidades } : item));
    }
    setApprovingUser(null);
    setToast("Cadastro aprovado.");
  }

  async function rejectUser(user: User) {
    if (supabase) {
      const result = await supabase.from("users").update({ status: "rejeitado" }).eq("id", user.id);
      if (result.error) { setToast("Não foi possível recusar o cadastro."); return; }
      await loadData();
    } else {
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: "rejeitado" } : item));
    }
    setToast("Cadastro recusado.");
  }

  async function updateUserRole(user: User, perfil: User["perfil"], unidades: Unidade[]) {
    if (supabase) {
      const upd = await supabase.from("users").update({ perfil }).eq("id", user.id);
      if (upd.error) { setToast("Não foi possível atualizar a função."); return; }
      await saveUnidades(user.id, unidades);
      await loadData();
    } else {
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, perfil, unidades } : item));
    }
    setEditUser(null);
    setToast("Função atualizada.");
  }

  async function saveProduct(product: Product) {
    let mensagem = "Produto salvo com sucesso.";
    if (supabase) {
      const produtoPayload = { referencia_produto: product.referencia_produto, nome_produto: product.nome_produto, descricao: product.descricao };
      if (editProduct === "new") {
        // A referência é única no catálogo inteiro. Se ela já existe, o item é o
        // mesmo produto em outra unidade: reaproveitamos o cadastro sem tocar no
        // nome/descrição que as demais unidades já usam. Recusamos quando a
        // referência já está nesta mesma unidade — seria sobrescrever o produto.
        const existente = await supabase.from("produtos").select("id,nome_produto").eq("referencia_produto", product.referencia_produto).maybeSingle();
        if (existente.error) { setToast("Não foi possível verificar a referência."); return; }
        let produtoId = existente.data?.id as string | undefined;
        if (produtoId) {
          const naUnidade = await supabase.from("estoque").select("id").eq("produto_id", produtoId).eq("unidade", product.unidade).maybeSingle();
          if (naUnidade.error) { setToast("Não foi possível verificar o estoque."); return; }
          if (naUnidade.data) { setToast(`A referência ${product.referencia_produto} já é do produto “${existente.data?.nome_produto}” na unidade ${product.unidade}. Edite o produto existente.`); return; }
          mensagem = `Estoque criado na unidade ${product.unidade} para o produto “${existente.data?.nome_produto}”, já cadastrado com esta referência.`;
        } else {
          const criado = await supabase.from("produtos").insert(produtoPayload).select("id").single();
          if (criado.error || !criado.data) { setToast("Não foi possível salvar o produto."); return; }
          produtoId = criado.data.id;
        }
        const estoqueResult = await supabase.from("estoque").insert({ produto_id: produtoId, unidade: product.unidade, quantidade_atual: product.quantidade_atual, estoque_minimo: product.estoque_minimo }).select("id");
        if (estoqueResult.error) { setToast("Não foi possível salvar o estoque."); return; }
        if (!estoqueResult.data?.length) { setToast(`Você não tem permissão para cadastrar estoque na unidade ${product.unidade}.`); return; }
      } else {
        // `.select()` devolve as linhas alteradas: sem ele, um update barrado
        // pela RLS afeta zero linhas e volta sem erro — o app anunciava sucesso
        // sem ter salvo nada.
        const produtoResult = await supabase.from("produtos").update(produtoPayload).eq("id", product.produto_id).select("id");
        if (produtoResult.error) { setToast(produtoResult.error.code === "23505" ? `A referência ${product.referencia_produto} já pertence a outro produto.` : "Não foi possível salvar o produto."); return; }
        if (!produtoResult.data.length) { setToast("Você não tem permissão para alterar produtos do catálogo."); return; }
        const estoqueResult = await supabase.from("estoque").update({ quantidade_atual: product.quantidade_atual, estoque_minimo: product.estoque_minimo }).eq("id", product.id).select("id");
        if (estoqueResult.error) { setToast("Não foi possível salvar o estoque."); return; }
        if (!estoqueResult.data.length) { setToast(`Você não tem permissão para alterar o estoque da unidade ${product.unidade}.`); return; }
      }
      await loadData();
    } else {
      setProducts((items) => editProduct === "new" ? [product, ...items] : items.map((item) => item.id === product.id ? product : item));
    }
    setEditProduct(null);
    setToast(mensagem);
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Excluir “${product.nome_produto}” da unidade ${product.unidade}?`)) return;
    let mensagem = "Produto excluído.";
    if (supabase) {
      const result = await supabase.from("estoque").delete().eq("id", product.id).select("id");
      if (result.error) { setToast("Não foi possível excluir o estoque."); return; }
      if (!result.data.length) { setToast(`Você não tem permissão para excluir o estoque da unidade ${product.unidade}.`); return; }
      // Sem estoque em nenhuma unidade o produto sai das telas, mas continuaria
      // ocupando a referência única do catálogo. Tiramos o cadastro também —
      // exceto quando há movimentações, que precisam dele para o histórico
      // (a FK de movimentacoes é `on delete restrict`).
      const restante = await supabase.from("estoque").select("id").eq("produto_id", product.produto_id).limit(1);
      if (!restante.error && !restante.data.length) {
        const removido = await supabase.from("produtos").delete().eq("id", product.produto_id);
        if (removido.error) mensagem = "Estoque removido. O produto segue no catálogo porque tem movimentações no histórico.";
      }
      await loadData();
    } else {
      setProducts((items) => items.filter((item) => item.id !== product.id));
    }
    setToast(mensagem);
  }

  async function register(product: Product, quantity: number, type: MovementType, note: string) {
    if (quantity <= 0 || (type === "retirada" && quantity > product.quantidade_atual)) {
      setToast("Quantidade inválida para o estoque disponível.");
      return false;
    }
    if (supabase) {
      const result = await supabase.rpc("registrar_movimentacao", { p_produto_id: product.produto_id, p_unidade: product.unidade, p_tipo: type, p_quantidade: quantity, p_observacao: note || null });
      if (result.error) { setToast(result.error.message); return false; }
      await loadData();
    } else {
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, quantidade_atual: type === "entrada" ? item.quantidade_atual + quantity : item.quantidade_atual - quantity, updated_at: new Date().toISOString() } : item));
      setMovements((items) => [{ id: crypto.randomUUID(), produto_id: product.produto_id, usuario_id: currentUser.id, unidade: product.unidade, tipo_movimentacao: type, quantidade: quantity, observacao: note, data_movimentacao: new Date().toISOString(), produto_nome: product.nome_produto, produto_referencia: product.referencia_produto, usuario_nome: currentUser.nome }, ...items]);
    }
    setQuickProduct(null);
    setToast(type === "retirada" ? "Retirada registrada com sucesso." : "Entrada registrada.");
    return true;
  }

  async function addPedido(descricao: string, quantidade: number, observacao: string) {
    const unidade = activeUnidade === "todas" ? (currentUser.unidades[0] ?? UNIDADES[0]) : activeUnidade;
    if (supabase) {
      const result = await supabase.from("pedidos_extras").insert({ usuario_id: currentUser.id, unidade, descricao, quantidade, observacao: observacao || null });
      if (result.error) { setToast("Não foi possível registrar o pedido."); return; }
      await loadData();
    } else {
      setPedidos((items) => [{ id: crypto.randomUUID(), usuario_id: currentUser.id, usuario_nome: currentUser.nome, unidade, descricao, quantidade, observacao, atendido: false, created_at: new Date().toISOString() }, ...items]);
    }
    setToast("Pedido extra registrado.");
  }

  async function togglePedido(pedido: PedidoExtra) {
    if (supabase) {
      const result = await supabase.from("pedidos_extras").update({ atendido: !pedido.atendido }).eq("id", pedido.id);
      if (result.error) { setToast("Não foi possível atualizar o pedido."); return; }
      await loadData();
    } else {
      setPedidos((items) => items.map((item) => item.id === pedido.id ? { ...item, atendido: !item.atendido } : item));
    }
  }

  if (!logged) return <Login connected={Boolean(supabase)} onLogin={login} onSignup={signup} onDemo={() => setLogged(true)} />;

  const nav: [Page, string, typeof Gauge][] = [
    ["dashboard", "Visão geral", Gauge], ["produtos", "Produtos", Boxes], ["retirada", "Nova retirada", ArrowUpFromLine], ["entrada", "Nova entrada", ArrowDownToLine], ["movimentacoes", "Movimentações", History], ["pedidos", "Pedido extra", PackagePlus], ["usuarios", "Usuários", Users],
  ];
  const unitOptions: (Unidade | "todas")[] = hasFullAccess(currentUser) ? ["todas", ...UNIDADES] : currentUser.unidades;
  const escopoLabel = unidadeLabelFor(activeUnidade);
  const visibleProducts = activeUnidade === "todas" ? products : products.filter((p) => p.unidade === activeUnidade);
  const visibleMovements = activeUnidade === "todas" ? movements : movements.filter((m) => m.unidade === activeUnidade);
  const visiblePedidos = activeUnidade === "todas" ? pedidos : pedidos.filter((p) => p.unidade === activeUnidade);
  const noStock = visibleProducts.filter((p) => stockStatus(p) === "sem").length;

  return (
    <div className="shell">
      {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Fechar menu" />}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="side-brand"><Brand /><button onClick={() => setMenu(false)}><X size={24} /></button></div>
        <nav>
          <small>PRINCIPAL</small>
          {nav.slice(0, 6).map(([key, label, Icon]) => <button key={key} className={page === key ? "active" : ""} onClick={() => { setPage(key); setMenu(false); }}><Icon size={24} />{label}{key === "produtos" && noStock > 0 && <em>{noStock}</em>}</button>)}
          <small className="admin-label">ADMINISTRAÇÃO</small>
          {nav.slice(6).map(([key, label, Icon]) => <button key={key} className={page === key ? "active" : ""} onClick={() => { setPage(key); setMenu(false); }}><Icon size={24} />{label}</button>)}
          <button><Settings size={24} />Configurações</button>
        </nav>
        <div className="side-status"><Wrench size={23} /><span><b>Central técnica</b><small>Operação normal</small></span><i /></div>
        <div className="side-user"><Avatar name={currentUser.nome} /><span><b>{currentUser.nome}</b><small>{currentUser.perfil}</small></span><button onClick={async () => { if (supabase) await supabase.auth.signOut(); setLogged(false); }}><LogOut size={23} /></button></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="title"><button className="menu" onClick={() => setMenu(true)}><Menu size={26} /></button><span><h1>{pageCopy[page][0]}</h1><p>{pageCopy[page][1]}</p></span></div>
          <div className="top-actions">
            <label className="select unit-switch"><Building2 size={21} /><select value={activeUnidade} onChange={(e) => setActiveUnidade(e.target.value as Unidade | "todas")}>{unitOptions.map((u) => <option key={u} value={u}>{u === "todas" ? "Todas as unidades" : `Unidade ${u}`}</option>)}</select><ChevronDown size={19} /></label>
            <label><Search size={23} /><input placeholder="Buscar referência..." /></label><button className="bell"><Bell size={24} /><i /></button><div className="top-user"><Avatar name={currentUser.nome} /><span><b>{currentUser.nome.split(" ")[0]}</b><small>{currentUser.perfil}</small></span><ChevronDown size={19} /></div></div>
        </header>
        <div className="content">
          {page === "dashboard" && <Dashboard products={visibleProducts} movements={visibleMovements} user={currentUser} unidadeLabel={escopoLabel} onPage={setPage} onQuick={setQuickProduct} />}
          {page === "produtos" && <Products products={visibleProducts} unidadeLabel={escopoLabel} onAdd={() => setEditProduct("new")} onEdit={setEditProduct} onDelete={removeProduct} onQuick={setQuickProduct} />}
          {page === "retirada" && <Withdrawal products={visibleProducts} user={currentUser} onRegister={register} />}
          {page === "entrada" && <Entry products={visibleProducts} user={currentUser} onRegister={register} />}
          {page === "movimentacoes" && <Movements movements={visibleMovements} products={visibleProducts} users={users} />}
          {page === "pedidos" && <PedidosExtras pedidos={visiblePedidos} user={currentUser} canManage={hasFullAccess(currentUser)} onAdd={addPedido} onToggle={togglePedido} />}
          {page === "usuarios" && <UsersPage users={users} onApprove={setApprovingUser} onReject={rejectUser} onEditRole={setEditUser} />}
        </div>
      </main>
      {editProduct && <ProductModal key={editProduct === "new" ? "new" : editProduct.id} product={editProduct === "new" ? null : editProduct} defaultUnidade={activeUnidade === "todas" ? (currentUser.unidades[0] ?? UNIDADES[0]) : activeUnidade} onClose={() => setEditProduct(null)} onSave={saveProduct} />}
      {quickProduct && <QuickModal key={quickProduct.id} product={quickProduct} user={currentUser} onClose={() => setQuickProduct(null)} onRegister={register} />}
      {editUser && <UserRoleModal key={editUser.id} user={editUser} title="Editar função" subtitle="Defina o nível de acesso e as unidades deste usuário." onClose={() => setEditUser(null)} onSave={updateUserRole} />}
      {approvingUser && <UserRoleModal key={`approve-${approvingUser.id}`} user={approvingUser} title="Aprovar cadastro" subtitle="Defina a função e as unidades antes de aprovar o acesso." onClose={() => setApprovingUser(null)} onSave={approveUser} />}
      {toast && <div className="toast"><span><Check size={20} /></span>{toast}<button onClick={() => setToast("")}><X size={20} /></button></div>}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return <span className="avatar">{initials(name)}</span>;
}

function Metric({ label, value, helper, tone, Icon }: { label: string; value: number; helper: string; tone: string; Icon: typeof Package }) {
  return <article className={`metric ${tone}`}><span><small>{label}</small><b>{String(value).padStart(2, "0")}</b><em>{helper}</em></span><i><Icon size={27} /></i></article>;
}

function Dashboard({ products, movements, user, unidadeLabel, onPage, onQuick }: { products: Product[]; movements: Movement[]; user: User; unidadeLabel: string; onPage: (page: Page) => void; onQuick: (product: Product) => void }) {
  const [exporting, setExporting] = useState(false);
  const out = products.filter((p) => stockStatus(p) === "sem").length;
  const low = products.filter((p) => stockStatus(p) === "baixo").length;
  const attention = products.filter((p) => stockStatus(p) !== "normal").sort((a, b) => a.quantidade_atual - b.quantidade_atual);
  async function handleExport() {
    setExporting(true);
    try { await exportStockExcel(products, movements, unidadeLabel); } finally { setExporting(false); }
  }
  return (
    <div className="dashboard">
      <section className="welcome"><span><small>Olá, {user.nome.split(" ")[0]} 👋</small><h2>Seu estoque precisa de atenção em {out + low} itens.</h2><p>Resumo atualizado agora · {unidadeLabel}</p></span><div className="welcome-actions"><button className="secondary" onClick={handleExport} disabled={exporting}><Download size={23} />{exporting ? "Gerando..." : "Exportar Excel"}</button><button className="primary" onClick={() => onPage("retirada")}><ArrowUpFromLine size={23} />Registrar retirada</button></div></section>
      <section className="metrics"><Metric label="Produtos cadastrados" value={products.length} helper="itens ativos no catálogo" tone="neutral" Icon={Package} /><Metric label="Estoque normal" value={products.length - out - low} helper="dentro do nível seguro" tone="green" Icon={PackageCheck} /><Metric label="Estoque baixo" value={low} helper="reposição recomendada" tone="yellow" Icon={AlertTriangle} /><Metric label="Sem estoque" value={out} helper="reposição urgente" tone="red" Icon={XCircle} /></section>
      <section className="dash-grid">
        <article className="panel attention"><PanelHead title="Itens que precisam de atenção" subtitle="Ordenados por criticidade do estoque" action={<button onClick={() => onPage("produtos")}>Ver todos <ArrowRight size={19} /></button>} />
          {attention.map((p) => <div className="attention-row" key={p.id}><ProductIcon status={stockStatus(p)} /><span><b>{p.nome_produto}</b><code>{p.referencia_produto} · {p.unidade}</code></span><Badge status={stockStatus(p)} /><strong>{p.quantidade_atual}<small>mín. {p.estoque_minimo}</small></strong><button disabled={!p.quantidade_atual} onClick={() => onQuick(p)}>Retirar</button></div>)}
        </article>
        <article className="panel recent"><PanelHead title="Últimas movimentações" subtitle="Atividade recente da equipe" action={<button onClick={() => onPage("movimentacoes")}><MoreHorizontal size={24} /></button>} />
          {movements.slice(0, 5).map((m) => <div className="recent-row" key={m.id}><i className={m.tipo_movimentacao}><MovementIcon type={m.tipo_movimentacao} /></i><span><b>{m.produto_nome}</b><small>{m.usuario_nome} · {m.unidade} · {dateLabel(m.data_movimentacao)}</small></span><strong className={m.tipo_movimentacao}>{m.tipo_movimentacao === "entrada" ? "+" : "−"}{m.quantidade}</strong></div>)}
          <button className="panel-footer" onClick={() => onPage("movimentacoes")}>Ver histórico completo <ArrowRight size={19} /></button>
        </article>
      </section>
      <section className="insight"><span><History size={25} /></span><div><b>Resumo operacional</b><p>Foram realizadas {movements.filter((m) => m.tipo_movimentacao === "retirada").length} retiradas recentes nesta seleção.</p></div><button onClick={() => onPage("movimentacoes")}>Abrir relatório</button></section>
    </div>
  );
}

function PanelHead({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <header className="panel-head"><span><h3>{title}</h3><p>{subtitle}</p></span>{action}</header>;
}

function ProductIcon({ status }: { status: StockStatus }) {
  return <i className={`product-icon ${status}`}><Package size={24} /></i>;
}

function MovementIcon({ type }: { type: MovementType }) {
  return type === "entrada" ? <ArrowDownToLine size={21} /> : <ArrowUpFromLine size={21} />;
}

function Products({ products, unidadeLabel, onAdd, onEdit, onDelete, onQuick }: { products: Product[]; unidadeLabel: string; onAdd: () => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void; onQuick: (p: Product) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | StockStatus>("todos");
  const [exportingChecklist, setExportingChecklist] = useState(false);
  const shown = products.filter((p) => (p.nome_produto + p.referencia_produto).toLowerCase().includes(query.toLowerCase()) && (filter === "todos" || stockStatus(p) === filter));
  async function handleChecklist() {
    setExportingChecklist(true);
    try { await exportChecklistExcel(shown, unidadeLabel); } finally { setExportingChecklist(false); }
  }
  return (
    <section className="panel data-panel">
      <div className="toolbar"><label className="search"><Search size={23} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou referência..." /></label><div><label className="select"><Filter size={21} /><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="todos">Todos os status</option><option value="normal">Em estoque</option><option value="baixo">Estoque baixo</option><option value="sem">Sem estoque</option></select><ChevronDown size={19} /></label><button className="secondary" onClick={handleChecklist} disabled={exportingChecklist || !shown.length}><ClipboardCheck size={23} />{exportingChecklist ? "Gerando..." : "Exportar checklist"}</button><button className="primary" onClick={onAdd}><Plus size={23} />Novo produto</button></div></div>
      <div className="table-wrap"><table><thead><tr><th>Produto</th><th>Referência</th><th>Unidade</th><th>Estoque</th><th>Mínimo</th><th>Status</th><th>Atualizado</th><th /></tr></thead><tbody>{shown.map((p) => <tr key={p.id}><td><div className="product-cell"><ProductIcon status={stockStatus(p)} /><span><b>{p.nome_produto}</b><small>{p.descricao}</small></span></div></td><td><code>{p.referencia_produto}</code></td><td><span className="unit-tag">{p.unidade}</span></td><td><strong>{p.quantidade_atual}</strong> un.</td><td>{p.estoque_minimo} un.</td><td><Badge status={stockStatus(p)} /></td><td className="muted">{dateLabel(p.updated_at)}</td><td><div className="row-actions"><button disabled={!p.quantidade_atual} onClick={() => onQuick(p)} title="Retirar"><ArrowUpFromLine size={22} /></button><button onClick={() => onEdit(p)} title="Editar"><Edit3 size={22} /></button><button className="danger" onClick={() => onDelete(p)} title="Excluir"><Trash2 size={22} /></button></div></td></tr>)}</tbody></table></div>
      {!shown.length && <div className="empty"><Search size={32} /><b>Nenhum produto encontrado</b><p>Altere a busca ou o filtro.</p></div>}
      <footer className="data-footer">Exibindo <b>{shown.length}</b> de <b>{products.length}</b> produtos <span><button disabled>‹</button><button className="current">1</button><button disabled>›</button></span></footer>
    </section>
  );
}

function Withdrawal({ products, user, onRegister }: { products: Product[]; user: User; onRegister: (p: Product, q: number, t: MovementType, n: string) => Promise<boolean> }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const available = products.filter((p) => p.quantidade_atual > 0 && (p.nome_produto + p.referencia_produto).toLowerCase().includes(query.toLowerCase()));
  async function submit(event: FormEvent) { event.preventDefault(); if (selected && await onRegister(selected, quantity, "retirada", note)) { setSelected(null); setQuantity(1); setNote(""); setQuery(""); } }
  return (
    <div className="withdraw-grid">
      <section className="panel picker"><PanelHead title="Selecione o produto" subtitle="Etapa 1 de 2 · Busque pela referência" /><label className="search big"><Search size={24} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite a referência ou nome do produto" /></label><div className="picker-list">{available.map((p) => <button className={selected?.id === p.id ? "selected" : ""} key={p.id} onClick={() => setSelected(p)}><ProductIcon status={stockStatus(p)} /><span><b>{p.nome_produto}</b><code>{p.referencia_produto} · {p.unidade}</code></span><strong>{p.quantidade_atual}<small>disponíveis</small></strong><i>{selected?.id === p.id && <Check size={18} />}</i></button>)}</div></section>
      <form className="panel withdraw-form" onSubmit={submit}><PanelHead title="Dados da retirada" subtitle="Etapa 2 de 2 · Revise antes de confirmar" />{selected ? <div className="form-body"><div className="selected-product"><ProductIcon status={stockStatus(selected)} /><span><small>Produto selecionado · {selected.unidade}</small><b>{selected.nome_produto}</b><code>{selected.referencia_produto}</code></span><button type="button" onClick={() => setSelected(null)}>Trocar</button></div><label className="field"><b>Quantidade retirada</b><div className="quantity"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={23} /></button><input type="number" min={1} max={selected.quantidade_atual} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /><button type="button" onClick={() => setQuantity(Math.min(selected.quantidade_atual, quantity + 1))}><Plus size={23} /></button></div><small>Máximo disponível: {selected.quantidade_atual} unidades</small></label><label className="field"><b>Observação / Ordem de serviço</b><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Ex.: OS 2789 · Cliente Zona Sul" /></label><div className="responsible"><Avatar name={user.nome} /><span><small>Responsável pela retirada</small><b>{user.nome}</b></span><em><ShieldCheck size={19} />Identificado automaticamente</em></div><button className="primary confirm" disabled={quantity <= 0 || quantity > selected.quantidade_atual}>Confirmar retirada <ArrowRight size={23} /></button></div> : <div className="placeholder"><span><ArrowUpFromLine size={30} /></span><b>Selecione um produto</b><p>Os dados da retirada aparecerão aqui.</p></div>}</form>
    </div>
  );
}

function Entry({ products, user, onRegister }: { products: Product[]; user: User; onRegister: (p: Product, q: number, t: MovementType, n: string) => Promise<boolean> }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const available = products.filter((p) => (p.nome_produto + p.referencia_produto).toLowerCase().includes(query.toLowerCase()));
  async function submit(event: FormEvent) { event.preventDefault(); if (selected && await onRegister(selected, quantity, "entrada", note)) { setSelected(null); setQuantity(1); setNote(""); setQuery(""); } }
  return (
    <div className="withdraw-grid">
      <section className="panel picker"><PanelHead title="Selecione o produto" subtitle="Etapa 1 de 2 · Busque pela referência" /><label className="search big"><Search size={24} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Digite a referência ou nome do produto" /></label><div className="picker-list">{available.map((p) => <button className={selected?.id === p.id ? "selected" : ""} key={p.id} onClick={() => setSelected(p)}><ProductIcon status={stockStatus(p)} /><span><b>{p.nome_produto}</b><code>{p.referencia_produto} · {p.unidade}</code></span><strong>{p.quantidade_atual}<small>em estoque</small></strong><i>{selected?.id === p.id && <Check size={18} />}</i></button>)}</div></section>
      <form className="panel withdraw-form" onSubmit={submit}><PanelHead title="Dados da entrada" subtitle="Etapa 2 de 2 · Revise antes de confirmar" />{selected ? <div className="form-body"><div className="selected-product"><ProductIcon status={stockStatus(selected)} /><span><small>Produto selecionado · {selected.unidade}</small><b>{selected.nome_produto}</b><code>{selected.referencia_produto}</code></span><button type="button" onClick={() => setSelected(null)}>Trocar</button></div><label className="field"><b>Quantidade recebida</b><div className="quantity"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={23} /></button><input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /><button type="button" onClick={() => setQuantity(quantity + 1)}><Plus size={23} /></button></div><small>Estoque atual: {selected.quantidade_atual} unidades</small></label><label className="field"><b>Observação / Nota fiscal</b><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Ex.: NF 10458 · Reposição" /></label><div className="responsible"><Avatar name={user.nome} /><span><small>Responsável pela entrada</small><b>{user.nome}</b></span><em><ShieldCheck size={19} />Identificado automaticamente</em></div><button className="primary confirm" disabled={quantity <= 0}>Confirmar entrada <ArrowRight size={23} /></button></div> : <div className="placeholder"><span><ArrowDownToLine size={30} /></span><b>Selecione um produto</b><p>Os dados da entrada aparecerão aqui.</p></div>}</form>
    </div>
  );
}

function Movements({ movements, products, users }: { movements: Movement[]; products: Product[]; users: User[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("todos");
  const [user, setUser] = useState("todos");
  const [product, setProduct] = useState("todos");
  const shown = movements.filter((m) => (m.produto_nome + m.produto_referencia + m.usuario_nome).toLowerCase().includes(query.toLowerCase()) && (type === "todos" || m.tipo_movimentacao === type) && (user === "todos" || m.usuario_id === user) && (product === "todos" || m.produto_id === product));
  return (
    <section className="panel data-panel">
      <div className="history-filters"><label className="search"><Search size={23} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar no histórico..." /></label><Select value={type} onChange={setType} options={[["todos", "Todos os tipos"], ["entrada", "Entradas"], ["retirada", "Retiradas"]]} /><Select value={user} onChange={setUser} options={[["todos", "Todos os usuários"], ...users.filter((u) => u.status === "aprovado").map((u) => [u.id, u.nome])]} /><Select value={product} onChange={setProduct} options={[["todos", "Todos os produtos"], ...products.map((p) => [p.id, p.nome_produto])]} /><label className="date"><small>De</small><input type="date" /></label><label className="date"><small>Até</small><input type="date" /></label></div>
      <div className="filter-count"><Filter size={19} />{shown.length} movimentações encontradas</div>
      <div className="table-wrap"><table className="history-table"><thead><tr><th>Data e hora</th><th>Responsável</th><th>Produto</th><th>Referência</th><th>Unidade</th><th>Movimentação</th><th>Quantidade</th><th>Observação</th></tr></thead><tbody>{shown.map((m) => <tr key={m.id}><td><span className="date-cell"><Clock3 size={19} />{dateLabel(m.data_movimentacao)}</span></td><td><span className="user-cell"><Avatar name={m.usuario_nome} /><b>{m.usuario_nome}</b></span></td><td><b>{m.produto_nome}</b></td><td><code>{m.produto_referencia}</code></td><td><span className="unit-tag">{m.unidade}</span></td><td><span className={`movement-type ${m.tipo_movimentacao}`}><MovementIcon type={m.tipo_movimentacao} />{m.tipo_movimentacao === "entrada" ? "Entrada" : "Retirada"}</span></td><td><strong className={m.tipo_movimentacao}>{m.tipo_movimentacao === "entrada" ? "+" : "−"}{m.quantidade} un.</strong></td><td className="muted">{m.observacao || "—"}</td></tr>)}</tbody></table></div>
      <footer className="data-footer">Exibindo <b>{shown.length}</b> movimentações <button className="secondary">Exportar relatório</button></footer>
    </section>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="select"><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={19} /></label>;
}

function PedidosExtras({ pedidos, user, canManage, onAdd, onToggle }: { pedidos: PedidoExtra[]; user: User; canManage: boolean; onAdd: (descricao: string, quantidade: number, observacao: string) => Promise<void>; onToggle: (p: PedidoExtra) => void }) {
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await onAdd(descricao, quantidade, observacao);
    setDescricao(""); setQuantidade(1); setObservacao("");
    setBusy(false);
  }
  return (
    <div className="withdraw-grid">
      <form className="panel withdraw-form" onSubmit={submit}>
        <PanelHead title="Novo pedido extra" subtitle="Itens que não fazem parte do catálogo de estoque" />
        <div className="form-body">
          <label className="field"><b>Descrição do item</b><input required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Cabo de força reserva" /></label>
          <label className="field"><b>Quantidade</b><div className="quantity"><button type="button" onClick={() => setQuantidade(Math.max(1, quantidade - 1))}><Minus size={23} /></button><input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} /><button type="button" onClick={() => setQuantidade(quantidade + 1)}><Plus size={23} /></button></div></label>
          <label className="field"><b>Observação / motivo</b><textarea rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Explique por que este item não está no estoque" /></label>
          <div className="responsible"><Avatar name={user.nome} /><span><small>Solicitado por</small><b>{user.nome}</b></span></div>
          <button className="primary confirm" disabled={busy || !descricao.trim()}>{busy ? "Enviando..." : "Registrar pedido"}<ArrowRight size={23} /></button>
        </div>
      </form>
      <section className="panel picker">
        <PanelHead title="Pedidos registrados" subtitle="Histórico de solicitações extras" />
        <div className="picker-list">
          {pedidos.map((p) => (
            <div className="pedido-row" key={p.id}>
              <span className={`pedido-status ${p.atendido ? "ok" : ""}`}>{p.atendido ? <Check size={19} /> : <Clock3 size={19} />}</span>
              <span><b>{p.descricao}</b><small>{p.usuario_nome} · {p.unidade} · {dateLabel(p.created_at)} · {p.quantidade} un.</small>{p.observacao && <small>{p.observacao}</small>}</span>
              {canManage && <button type="button" className={p.atendido ? "secondary" : "primary"} onClick={() => onToggle(p)}>{p.atendido ? "Reabrir" : "Marcar atendido"}</button>}
            </div>
          ))}
          {!pedidos.length && <div className="empty"><Package size={32} /><b>Nenhum pedido extra</b><p>Os pedidos registrados aparecerão aqui.</p></div>}
        </div>
      </section>
    </div>
  );
}

function UsersPage({ users, onApprove, onReject, onEditRole }: { users: User[]; onApprove: (u: User) => void; onReject: (u: User) => void; onEditRole: (u: User) => void }) {
  const pending = users.filter((u) => u.status === "pendente");
  const listed = users.filter((u) => u.status !== "pendente");
  return (
    <div className="users-grid">
      <section className="panel data-panel">
        {pending.length > 0 && (
          <div className="pending-panel">
            <PanelHead title="Cadastros pendentes" subtitle={`${pending.length} solicitação(ões) aguardando aprovação`} />
            <div className="pending-list">
              {pending.map((u) => (
                <div className="pending-row" key={u.id}>
                  <Avatar name={u.nome} />
                  <span><b>{u.nome}</b><small>{u.email}</small></span>
                  <div className="pending-actions">
                    <button type="button" className="secondary" onClick={() => onReject(u)}><X size={20} />Recusar</button>
                    <button type="button" className="primary" onClick={() => onApprove(u)}><Check size={20} />Aprovar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="toolbar"><label className="search"><Search size={23} /><input placeholder="Buscar usuário..." /></label><button className="primary"><Plus size={23} />Novo usuário</button></div>
        <div className="team-grid">{listed.map((u) => <article key={u.id}><header><Avatar name={u.nome} /><span className={u.status === "rejeitado" ? "status-off" : ""}>● {u.status === "rejeitado" ? "Recusado" : "Ativo"}</span><button type="button" onClick={() => onEditRole(u)} title="Editar função"><MoreHorizontal size={23} /></button></header><b>{u.nome}</b><small>{u.email}</small><footer><ShieldCheck size={19} />{u.perfil}</footer><footer className="unit-footer">{hasFullAccess(u) ? "Todas as unidades" : (u.unidades.length ? u.unidades.join(", ") : "Sem unidade")}</footer></article>)}</div>
      </section>
      <aside className="panel permissions"><ShieldCheck size={29} /><h3>Perfis de acesso</h3><p>As permissões são protegidas por políticas RLS.</p>{[["A", "Administrador", "Controle total do sistema, todas as unidades."], ["S", "Supervisor", "Aprova cadastros e gerencia produtos em todas as unidades."], ["A", "Analista", "Cadastro e movimentação de produtos na sua unidade."], ["O", "Operador", "Consulta e retiradas próprias nas unidades vinculadas."]].map(([l, t, d], i) => <div key={i}><span>{l}</span><p><b>{t}</b><small>{d}</small></p></div>)}</aside>
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-bg" onMouseDown={onClose}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><header><span><h2>{title}</h2><p>{subtitle}</p></span><button onClick={onClose}><X size={25} /></button></header>{children}</section></div>;
}

function ProductModal({ product, defaultUnidade, onClose, onSave }: { product: Product | null; defaultUnidade: Unidade; onClose: () => void; onSave: (p: Product) => Promise<void> }) {
  const [form, setForm] = useState<Product>(product ?? { id: crypto.randomUUID(), produto_id: crypto.randomUUID(), unidade: defaultUnidade, referencia_produto: "", nome_produto: "", descricao: "", quantidade_atual: 0, estoque_minimo: 1, updated_at: new Date().toISOString() });
  return (
    <Modal title={product ? "Editar produto" : "Cadastrar produto"} subtitle="Preencha as informações de estoque do item." onClose={onClose}>
      <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSave({ ...form, updated_at: new Date().toISOString() }); }}>
        <div className="two">
          <label className="field"><b>Referência do produto</b><input required value={form.referencia_produto} onChange={(e) => setForm({ ...form, referencia_produto: e.target.value.toUpperCase() })} placeholder="Ex.: 006R04399" /></label>
          <label className="field"><b>Nome do produto</b><input required value={form.nome_produto} onChange={(e) => setForm({ ...form, nome_produto: e.target.value })} placeholder="Ex.: Toner Preto" /></label>
        </div>
        <label className="field"><b>Descrição</b><textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></label>
        <div className="two">
          <label className="field"><b>Unidade</b>{product ? <input value={form.unidade} disabled /> : <Select value={form.unidade} onChange={(v) => setForm({ ...form, unidade: v as Unidade })} options={UNIDADES.map((u) => [u, u])} />}</label>
          <label className="field"><b>Estoque mínimo</b><input type="number" min={0} value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: Number(e.target.value) })} /></label>
        </div>
        <label className="field"><b>Quantidade atual</b><input type="number" min={0} value={form.quantidade_atual} onChange={(e) => setForm({ ...form, quantidade_atual: Number(e.target.value) })} /></label>
        {!product && <small className="unit-hint">A referência identifica o produto no catálogo inteiro. Se ela já existir em outra unidade, o cadastro é reaproveitado e só a quantidade desta unidade é criada; se já existir nesta unidade, o cadastro é recusado.</small>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary"><Check size={21} />Salvar produto</button></div>
      </form>
    </Modal>
  );
}

function QuickModal({ product, user, onClose, onRegister }: { product: Product; user: User; onClose: () => void; onRegister: (p: Product, q: number, t: MovementType, n: string) => Promise<boolean> }) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  return <Modal title="Registrar retirada" subtitle="A movimentação ficará vinculada ao seu usuário." onClose={onClose}><form className="modal-form" onSubmit={(e) => { e.preventDefault(); onRegister(product, quantity, "retirada", note); }}><div className="selected-product modal-selected"><ProductIcon status={stockStatus(product)} /><span><small>Produto · {product.unidade}</small><b>{product.nome_produto}</b><code>{product.referencia_produto}</code></span><strong>{product.quantidade_atual}<small>disponíveis</small></strong></div><label className="field"><b>Quantidade retirada</b><input type="number" min={1} max={product.quantidade_atual} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></label><label className="field"><b>Observação / Ordem de serviço</b><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: OS 2789" /></label><div className="responsible compact"><Avatar name={user.nome} /><span><small>Responsável</small><b>{user.nome}</b></span></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={quantity <= 0 || quantity > product.quantidade_atual}><ArrowUpFromLine size={21} />Confirmar retirada</button></div></form></Modal>;
}

function UserRoleModal({ user, title, subtitle, onClose, onSave }: { user: User; title: string; subtitle: string; onClose: () => void; onSave: (u: User, perfil: User["perfil"], unidades: Unidade[]) => Promise<void> }) {
  const [perfil, setPerfil] = useState<User["perfil"]>(user.perfil);
  const [unidades, setUnidades] = useState<Unidade[]>(user.unidades);
  const precisaUnidade = perfil === "Operador" || perfil === "Analista";
  const singleUnit = perfil === "Analista";

  function changePerfil(next: User["perfil"]) {
    setPerfil(next);
    if (next === "Administrador" || next === "Supervisor") setUnidades([]);
    else if (next === "Analista" && unidades.length > 1) setUnidades([unidades[0]]);
  }

  function toggleUnidade(u: Unidade) {
    if (singleUnit) { setUnidades([u]); return; }
    setUnidades((items) => items.includes(u) ? items.filter((x) => x !== u) : [...items, u]);
  }

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSave(user, perfil, precisaUnidade ? unidades : []); }}>
        <div className="selected-product modal-selected"><Avatar name={user.nome} /><span><small>Usuário</small><b>{user.nome}</b><code>{user.email}</code></span></div>
        <label className="field"><b>Função</b><Select value={perfil} onChange={(v) => changePerfil(v as User["perfil"])} options={[["Operador", "Operador"], ["Analista", "Analista"], ["Supervisor", "Supervisor"], ["Administrador", "Administrador"]]} /></label>
        {precisaUnidade ? (
          <label className="field">
            <b>{singleUnit ? "Unidade" : "Unidades permitidas"}</b>
            <div className="unit-picker">{UNIDADES.map((u) => <button type="button" key={u} className={unidades.includes(u) ? "selected" : ""} onClick={() => toggleUnidade(u)}>{u}</button>)}</div>
            <small>{singleUnit ? "Analista fica restrito a uma única unidade." : "Selecione uma ou mais unidades que este Operador pode acessar."}</small>
          </label>
        ) : (
          <div className="form-notice">Administrador e Supervisor têm acesso a todas as unidades.</div>
        )}
        <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={precisaUnidade && unidades.length === 0}><Check size={21} />Salvar</button></div>
      </form>
    </Modal>
  );
}
