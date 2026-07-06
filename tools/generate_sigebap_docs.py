from pathlib import Path
import datetime
import json
import re

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import Image, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPDF = ROOT / "output" / "pdf"
DOCS.mkdir(exist_ok=True)
OUTPDF.mkdir(parents=True, exist_ok=True)

GEN_DATE = datetime.datetime.now().strftime("%d/%m/%Y")
VERSION = "2.0"


def read(path):
    return (ROOT / path).read_text(encoding="utf-8", errors="replace")


routes_src = read("src/routes/AppRoutes.jsx")
perms_src = read("src/config/permissions.js")
menu_src = read("src/config/menu.js")
package = json.loads(read("package.json"))

routes = sorted(set(re.findall(r'path="([^"]+)"', routes_src)))
pages = sorted(p.stem for p in (ROOT / "src" / "pages").glob("*.jsx"))
components = sorted(str(p.relative_to(ROOT)).replace("\\", "/") for p in (ROOT / "src" / "components").rglob("*.jsx"))
services = sorted(p.stem for p in (ROOT / "src" / "services").glob("*.js"))
stores = sorted(p.stem for p in (ROOT / "src" / "store").glob("*.js"))

all_code = ""
for folder in ["src", "supabase", "database"]:
    base = ROOT / folder
    if base.exists():
        for p in base.rglob("*"):
            if p.suffix.lower() in [".js", ".jsx", ".ts", ".tsx", ".sql"]:
                all_code += "\n" + p.read_text(encoding="utf-8", errors="replace")

tables = sorted(set(re.findall(r"\.from\(['\"]([^'\"]+)['\"]\)", all_code)))
rpcs = sorted(set(re.findall(r"\.rpc\(['\"]([^'\"]+)['\"]", all_code)))
storage_buckets = sorted(set(re.findall(r"storage\.from\(['\"]([^'\"]+)['\"]\)", all_code)))
roles = re.findall(r"\n\s*([a-z_]+):\s*\[", perms_src)
techs = package.get("dependencies", {})

modules = [
    ("Dashboard", "/dashboard", "dashboard", "Apresentar uma visão executiva da operação em menos de 10 segundos.", ["KPIs gerais", "prioridades operacionais", "atividades recentes", "atalhos rápidos", "visão por perfil"], ["reduz tempo de análise", "prioriza riscos", "apoia decisão gerencial"], "[Inserir captura da tela Dashboard Executivo]"),
    ("Agenda Operacional", "/agenda-operacional", "agendaOperacional", "Centralizar atividades programadas, OS vinculadas, lembretes e agenda diária das equipes.", ["abas por período", "KPIs de agenda", "lista cronológica", "geração de OS", "visualização em calendário"], ["organiza o trabalho diário", "substitui controles paralelos", "melhora previsibilidade"], "[Inserir captura da Agenda Operacional]"),
    ("Ordens de Serviço", "/os", "os", "Ser a central única para abertura, acompanhamento, execução e histórico de OS.", ["nova OS", "filtros", "paginação", "detalhe da OS", "histórico compacto", "anexos", "relatório técnico"], ["rastreabilidade ponta a ponta", "padronização de execução", "menos retrabalho"], "[Inserir captura da central de Ordens de Serviço]"),
    ("RDO", "/relatorio", "relatorio", "Registrar a situação diária da EBAP com status, evidências e fluxo de validação CCO.", ["assistente por etapas", "equipamentos por EBAP", "fotos obrigatórias", "autosave", "validação CCO"], ["registro operacional confiável", "evidências fotográficas", "atualização posterior de ativos"], "[Inserir captura do RDO Desktop e Mobile]"),
    ("Sala de Situação", "/sala-situacao-ebaps", "salaSituacaoEbaps", "Consolidar filas críticas e pendências operacionais por EBAP.", ["OS críticas", "RDO pendentes", "compras em aprovação", "SST", "estoque crítico"], ["coordenação rápida", "visão integrada", "menor dispersão entre módulos"], "[Inserir captura da Sala de Situação]"),
    ("Chat Corporativo", "/comunicacao", "comunicacao", "Substituir comunicação operacional dispersa por conversas auditáveis dentro da plataforma.", ["conversas diretas", "grupos", "arquivos", "áudio", "presença", "pesquisa de pessoas"], ["reduz dependência do WhatsApp", "mantém histórico", "centraliza comunicação"], "[Inserir captura do Chat Corporativo]"),
    ("Planejamento de Manutenção", "/manutencao", "manutencao", "Administrar cronogramas, importações e programação futura de manutenção.", ["importação XLS", "calendário administrativo", "histórico", "edição de eventos", "classificação por área"], ["planejamento padronizado", "continuidade operacional", "entrada estruturada para Agenda"], "[Inserir captura do Planejamento de Manutenção]"),
    ("Ativos", "/ativos", "ativos", "Ser a fonte única de verdade dos equipamentos das EBAPs.", ["status operacional", "agrupamento por EBAP", "histórico de status", "integração com OS", "dashboard de ativos"], ["rastreabilidade do equipamento", "indicadores confiáveis", "base para Sala de Situação"], "[Inserir captura do módulo Ativos]"),
    ("Compras", "/compras", "compras", "Gerenciar solicitações, aprovações, cotações e recebimentos de compras.", ["solicitação", "itens", "aprovações", "fornecedores", "timeline", "integração com almoxarifado"], ["controle de aquisições", "registro de aprovação", "redução de perda de informação"], "[Inserir captura do módulo Compras]"),
    ("Almoxarifado", "/almoxarifado", "almoxarifado", "Controlar materiais, estoque, locais e movimentações.", ["cadastro de itens", "movimentações", "estoque mínimo", "histórico", "indicadores"], ["prevenção de ruptura", "rastreabilidade de materiais", "apoio à execução de OS"], "[Inserir captura do Almoxarifado]"),
    ("CCO", "/cco-relatorios-diarios", "ccoRelatoriosDiarios", "Validar RDOs e OS originadas pela operação antes de atualizar indicadores e ativos.", ["fila de validação", "detalhes do relatório", "histórico", "aprovação", "solicitação de correção"], ["controle operacional", "governança", "qualidade das informações"], "[Inserir captura da Fila CCO]"),
    ("Usuários", "/usuarios", "usuarios", "Administrar acessos, perfis e dados dos usuários do SIGEBAP.", ["cadastro", "aprovação", "ativação", "reset de senha", "paginação", "perfil operacional"], ["segurança de acesso", "controle por função", "governança administrativa"], "[Inserir captura da tela Usuários]"),
    ("Configurações e UI Kit", "/config", "config", "Concentrar preferências, componentes oficiais e base visual do sistema.", ["configurações", "SIGEBAP UI Kit", "componentes oficiais", "padrões visuais"], ["consistência visual", "evolução controlada", "menos duplicidade de componentes"], "[Inserir captura do UI Kit]"),
    ("Mobile", "Responsivo/PWA", "conforme perfil", "Oferecer experiência operacional própria para campo, celular e tablet.", ["navegação inferior", "cards grandes", "chat estilo aplicativo", "RDO em wizard", "perfil e foto"], ["preenchimento rápido", "uso em campo", "menor curva de aprendizado"], "[Inserir capturas Mobile: Início, RDO, OS, Chat e Perfil]"),
]

profiles = [
    ("Operador", "Registrar RDO, abrir solicitações e acompanhar informações da própria operação.", ["RDO", "OS", "Ativos", "Comunicação", "Perfil"], "Fluxo focado em preenchimento rápido, fotos e status de equipamentos."),
    ("Técnico", "Executar OS atribuídas à equipe ou diretamente ao usuário.", ["Ordens de Serviço", "Relatório técnico", "Anexos", "Comunicação"], "Fluxo reduzido para situação encontrada, evidências, execução e conclusão."),
    ("CCO", "Validar RDOs e OS operacionais, garantindo qualidade antes de atualizar a base.", ["CCO - RDO", "CCO - OS", "Sala de Situação", "Comunicação"], "Fluxo de conferência, aprovação, rejeição e solicitação de correção."),
    ("Supervisor", "Coordenar área técnica, planejar agenda e validar execuções.", ["Agenda Operacional", "OS", "Supervisão", "Planejamento", "RDO"], "Fluxo centrado em agenda, priorização, equipes e validação técnica."),
    ("Fiscal Operacional", "Abrir e acompanhar solicitações com baixa complexidade de uso.", ["Abrir OS", "Minhas Solicitações"], "Experiência mobile com duas ações principais e linguagem simples."),
    ("Fiscal Gestor", "Acompanhar solicitações, indicadores e visão da Prefeitura.", ["Dashboard Prefeitura", "OS", "Relatórios", "Financeiro"], "Visão de acompanhamento sem interferir na aprovação técnica interna."),
    ("Gerência", "Acompanhar indicadores, riscos, produtividade e situação geral.", ["Dashboard", "Agenda", "OS", "Ativos", "Compras", "Financeiro"], "Fluxo executivo com acesso amplo para análise e tomada de decisão."),
    ("Diretoria", "Obter visão estratégica e consolidada da operação.", ["Dashboard Geral", "Indicadores", "Relatórios", "Administrativo"], "Acesso amplo para visão corporativa e acompanhamento do contrato."),
    ("Administrador", "Configurar usuários, permissões, UI Kit e parâmetros gerais.", ["Usuários", "Configurações", "UI Kit", "Todos os módulos"], "Fluxo de governança, manutenção da plataforma e suporte à operação."),
]

flows = {
    "Fluxo da Ordem de Serviço": ["Solicitação", "CCO ou Supervisão", "Supervisor da área", "Equipe responsável", "Execução técnica", "Validação do supervisor", "Aprovação final quando aplicável", "Concluído"],
    "Fluxo do RDO": ["Operador preenche RDO", "Anexa evidências obrigatórias", "Envia para CCO", "CCO analisa", "Aprova ou solicita correção", "Atualiza indicadores e ativos", "Histórico preservado"],
    "Fluxo da Agenda Operacional": ["Plano importado ou atividade manual", "Agenda cronológica", "Supervisor prioriza", "Gera OS quando necessário", "Equipe executa", "Status retorna para Agenda"],
    "Fluxo do Planejamento": ["Importação XLS", "Classificação por área", "Validação do supervisor", "Criação no cronograma", "Disponibilização na Agenda", "Histórico de importação"],
    "Fluxo de Compras": ["Solicitação", "Itens e justificativa", "Aprovação", "Cotação/compra", "Recebimento", "Integração com estoque", "Histórico"],
}


def md_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        out.append("| " + " | ".join(str(c).replace("\n", "<br>") for c in row) + " |")
    return "\n".join(out)


def flow_mermaid(steps):
    lines = ["```mermaid", "flowchart TD"]
    for i, step in enumerate(steps):
        lines.append(f'  A{i}["{step}"]')
        if i:
            lines.append(f"  A{i-1} --> A{i}")
    lines.append("```")
    return "\n".join(lines)


def add_file(name, title, body, chapters):
    (DOCS / name).write_text(f"# {title}\n\n{body.strip()}\n", encoding="utf-8")
    chapters.append((name, title))


def generate_markdown():
    chapters = []
    (DOCS / "README.md").write_text(
        f"""# Documentação Oficial do SIGEBAP

Versão do documento: {VERSION}
Data de geração: {GEN_DATE}
Produto: SIGEBAP - Sistema Integrado de Gestão das Estações Elevatórias de Águas Pluviais
Empresa: OBRACON

## Arquivos

- `01-Capa.md`
- `02-Apresentacao.md`
- `03-Objetivos.md`
- `04-Problemas.md`
- `05-Arquitetura.md`
- `06-Modulos.md`
- `07-Perfis.md`
- `08-Fluxos.md`
- `09-Mobile.md`
- `10-Roadmap.md`
- `11-Beneficios.md`
- `12-Conclusao.md`

## PDF

- `docs/SIGEBAP-Documento-Executivo-v2.0.pdf`
- `output/pdf/SIGEBAP-Documento-Executivo-v2.0.pdf`

Esta documentação foi gerada com base na leitura do projeto React, rotas, permissões, módulos, serviços e integrações Supabase existentes.
""",
        encoding="utf-8",
    )

    add_file("01-Capa.md", "SIGEBAP - Documento Executivo", f"""
**SIGEBAP**
Sistema Integrado de Gestão das Estações Elevatórias de Águas Pluviais

**Documento Executivo**
Versão {VERSION}

**Empresa:** OBRACON
**Data de geração:** {GEN_DATE}

## Autores

**João Lucas Soares Almeida**
Idealizador, Analista de Sistemas e Desenvolvedor do SIGEBAP.

**Alex Gomes de Matos Martins**
Idealizador e responsável pela concepção operacional do sistema.
""", chapters)

    add_file("02-Apresentacao.md", "Apresentação e Visão Geral", f"""
O SIGEBAP é uma plataforma operacional corporativa desenvolvida para centralizar a gestão das Estações Elevatórias de Águas Pluviais. O sistema reúne acompanhamento de ordens de serviço, RDO, ativos, comunicação, compras, almoxarifado, planejamento, agenda operacional, indicadores e validações.

## Escopo atual identificado no código

- Páginas React identificadas: {len(pages)}
- Componentes React identificados: {len(components)}
- Serviços de integração identificados: {len(services)}
- Stores de estado identificados: {len(stores)}
- Rotas identificadas: {len(routes)}
- Tabelas Supabase referenciadas: {len(tables)}

## Rotas principais

{md_table(["Rota"], [[r] for r in routes[:40]])}
""", chapters)

    add_file("03-Objetivos.md", "Objetivos do Projeto", """
O SIGEBAP nasceu para organizar a operação das EBAPs em uma plataforma única, reduzindo dependência de planilhas, mensagens avulsas e controles sem rastreabilidade.

## Objetivos estratégicos

- Centralizar informações operacionais em uma fonte única de verdade.
- Padronizar abertura, execução e validação de Ordens de Serviço.
- Registrar RDOs com evidências fotográficas e fluxo de aprovação.
- Integrar ativos, OS, agenda, indicadores e sala de situação.
- Criar rastreabilidade completa para auditoria operacional.
- Apoiar Gerência e Diretoria com indicadores executivos.
- Disponibilizar uma experiência mobile simples para campo.
""", chapters)

    add_file("04-Problemas.md", "Cenário Atual e Problemas Resolvidos", """
Antes do SIGEBAP, a operação dependia de múltiplos canais e documentos descentralizados. Esse cenário cria riscos de perda de informação, decisões sem histórico e dificuldade para comprovar atividades executadas.

## Problemas observados

- Uso excessivo de WhatsApp para decisões operacionais.
- Planilhas paralelas sem padronização entre áreas.
- Baixa rastreabilidade de mudanças de status dos equipamentos.
- Dificuldade para localizar histórico de OS, RDO e evidências.
- Falta de indicadores consolidados para Gerência e Diretoria.
- Comunicação descentralizada entre operação, CCO, supervisão e equipes.
""", chapters)

    add_file("05-Arquitetura.md", "Arquitetura e Tecnologias", f"""
O SIGEBAP utiliza uma arquitetura web moderna com frontend React, Supabase como backend operacional e integrações específicas para arquivos, realtime, autenticação, histórico e inteligência artificial.

{md_table(["Camada", "Tecnologia", "Responsabilidade"], [
["Frontend", "React + Vite", "Interface desktop, mobile, rotas, estados e componentes"],
["Design System", "Tailwind + componentes UI", "Padronização visual e componentes oficiais"],
["Backend", "Supabase", "Banco PostgreSQL, autenticação, storage, realtime e políticas RLS"],
["Dados", "PostgreSQL", "Tabelas operacionais de OS, RDO, ativos, compras, chat e histórico"],
["IA", "OpenAI via Edge Function", "Melhoria de texto técnico sem inventar informações"],
["Deploy", "Vercel", "Publicação frontend e distribuição da aplicação"]
])}

## Dependências principais

{md_table(["Pacote", "Versão"], sorted([[k, v] for k, v in techs.items()]))}

## Buckets de Storage identificados

{md_table(["Bucket"], [[b] for b in storage_buckets]) if storage_buckets else "Nenhum bucket identificado."}

## Tabelas Supabase referenciadas

{md_table(["Tabela"], [[t] for t in tables])}
""", chapters)

    module_md = []
    for name, route, permission, objective, features, benefits, screenshot in modules:
        module_md.append(f"""## {name}

**Rota:** `{route}`
**Permissão:** `{permission}`

**Objetivo:** {objective}

**Principais funcionalidades:**
{chr(10).join("- " + f for f in features)}

**Benefícios:**
{chr(10).join("- " + b for b in benefits)}

**Captura de tela:** {screenshot}
""")
    add_file("06-Modulos.md", "Módulos do Sistema", "\n".join(module_md), chapters)

    profile_md = []
    for name, objective, screens, flow in profiles:
        profile_md.append(f"""## {name}

**Objetivo:** {objective}

**Telas utilizadas:** {", ".join(screens)}.

**Fluxo de trabalho:** {flow}

**Permissões:** controladas por `src/config/permissions.js`.
""")
    profile_md.append("\n## Perfis cadastrados no código\n\n" + md_table(["Perfil"], [[r] for r in roles]))
    add_file("07-Perfis.md", "Perfis de Usuário e Permissões", "\n".join(profile_md), chapters)

    flow_md = []
    for title, steps in flows.items():
        flow_md.append(f"## {title}\n\n{flow_mermaid(steps)}\n\n" + " → ".join(steps))
    add_file("08-Fluxos.md", "Fluxos Operacionais", "\n\n".join(flow_md), chapters)

    add_file("09-Mobile.md", "Versão Mobile", """
A versão mobile do SIGEBAP não replica o desktop. Ela prioriza operação em campo, botões grandes, navegação inferior e fluxos lineares.

## Diretrizes mobile

- Navegação inferior para Início, OS, RDO, Chat e Perfil.
- Cards grandes para ações de campo.
- RDO em formato de assistente com etapas, progresso e botões Anterior/Próximo.
- Chat com navegação semelhante a aplicativos de mensagem.
- Perfil com foto, dados de acesso e logout.
- Tabelas extensas substituídas por cards.

## Capturas previstas

- [Inserir captura da Home Mobile]
- [Inserir captura do RDO Mobile]
- [Inserir captura das Minhas OS Mobile]
- [Inserir captura do Chat Mobile]
- [Inserir captura do Perfil Mobile]
""", chapters)

    add_file("10-Roadmap.md", "Roadmap Evolutivo", """
## Curto prazo

- Consolidar Agenda Operacional como tela inicial dos supervisores.
- Refinar dashboards por perfil.
- Corrigir textos remanescentes e padronizar labels oficiais.
- Ajustar capturas oficiais por módulo.

## Médio prazo

- Ampliar automações entre RDO, Ativos, OS e Sala de Situação.
- Expandir indicadores executivos e relatórios PDF.
- Consolidar modelos opcionais de checklist por equipamento.
- Melhorar busca global e notificações inteligentes.

## Longo prazo

- Evoluir Sala de Situação em tempo real.
- Criar indicadores preditivos por histórico de falhas.
- Ampliar integrações externas e APIs.
- Desenvolver camadas avançadas de BI e auditoria.
""", chapters)

    add_file("11-Beneficios.md", "Benefícios Esperados", """
- Redução do uso de WhatsApp para registros operacionais.
- Centralização das informações em uma única plataforma.
- Rastreabilidade de OS, RDO, ativos, compras e decisões.
- Padronização dos fluxos de validação.
- Indicadores para priorização e gestão.
- Histórico confiável para auditorias e apresentações.
- Melhoria na produtividade das equipes.
- Comunicação em tempo real com contexto operacional.
- Menor retrabalho em relatórios técnicos.
""", chapters)

    add_file("12-Conclusao.md", "Conclusão Executiva", """
O SIGEBAP representa uma evolução operacional importante para a gestão das EBAPs. A plataforma centraliza dados, padroniza processos e cria rastreabilidade de ponta a ponta, permitindo que a operação seja acompanhada com maior confiabilidade.

A versão atual já contempla módulos essenciais como Dashboard, Agenda Operacional, Ordens de Serviço, RDO, Sala de Situação, Chat Corporativo, Planejamento de Manutenção, Ativos, Compras, Almoxarifado e Administração de Usuários.

A continuidade do projeto deve manter o foco em três pilares: simplicidade para o usuário de campo, rastreabilidade para gestão operacional e indicadores executivos para tomada de decisão.
""", chapters)
    return chapters


styles = getSampleStyleSheet()
brand_blue = colors.HexColor("#0A1633")
mid_blue = colors.HexColor("#16356B")
accent = colors.HexColor("#3B82F6")
light = colors.HexColor("#D6E4FF")
slate = colors.HexColor("#64748B")
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=42, leading=48, textColor=colors.white, alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=18, leading=24, textColor=light, alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name="CoverMeta", fontName="Helvetica", fontSize=15, leading=21, textColor=mid_blue, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name="DocH1", fontName="Helvetica-Bold", fontSize=24, leading=30, textColor=brand_blue, spaceAfter=12))
styles.add(ParagraphStyle(name="DocH2", fontName="Helvetica-Bold", fontSize=17, leading=22, textColor=mid_blue, spaceBefore=10, spaceAfter=8))
styles.add(ParagraphStyle(name="DocH3", fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=mid_blue, spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name="DocBody", fontName="Helvetica", fontSize=10.5, leading=15, textColor=colors.HexColor("#1F2937"), spaceAfter=7))
styles.add(ParagraphStyle(name="Small", fontName="Helvetica", fontSize=8.5, leading=12, textColor=slate))
styles.add(ParagraphStyle(name="Badge", fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=colors.white, alignment=TA_CENTER))


def para(text, style="DocBody"):
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
    return Paragraph(safe, styles[style])


def bullet(items):
    return [Paragraph("• " + str(item), styles["DocBody"]) for item in items]


def make_table(data, widths=None, header=True):
    wrapped = []
    for row in data:
        wrapped_row = []
        for cell in row:
            if isinstance(cell, Paragraph):
                wrapped_row.append(cell)
            else:
                wrapped_row.append(para(cell, "DocBody"))
        wrapped.append(wrapped_row)
    t = Table(wrapped, colWidths=widths, repeatRows=1 if header else 0)
    ts = [
        ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        ts += [("BACKGROUND", (0, 0), (-1, 0), mid_blue), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")]
    t.setStyle(TableStyle(ts))
    return t


def screenshot_box(label):
    t = Table([[Paragraph(label, styles["Small"])]], colWidths=[16 * cm], rowHeights=[5.2 * cm])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, accent),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    return t


def draw_flow(title, steps):
    rows = [[Paragraph(title, styles["DocH3"])]]
    rows += [[Paragraph(f"{i + 1}. {s}", styles["DocBody"])] for i, s in enumerate(steps)]
    t = Table(rows, colWidths=[16 * cm])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, accent),
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#DBEAFE")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(brand_blue)
    canvas.rect(0, h - 1.05 * cm, w, 1.05 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(1.4 * cm, h - 0.65 * cm, "SIGEBAP - Documento Executivo v2.0")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(w - 1.4 * cm, h - 0.65 * cm, f"Gerado em {GEN_DATE}")
    canvas.setFillColor(slate)
    canvas.drawString(1.4 * cm, 0.8 * cm, "OBRACON | Sistema Integrado de Gestão das EBAPs")
    canvas.drawRightString(w - 1.4 * cm, 0.8 * cm, f"Página {doc.page}")
    canvas.restoreState()


def section(story, title):
    story.append(PageBreak())
    story.append(para(title, "DocH1"))


def build_pdf(chapters):
    pdf_path = DOCS / "SIGEBAP-Documento-Executivo-v2.0.pdf"
    logo_path = ROOT / "public" / "brand" / "uniao-obracon-logo.png"
    story = []

    story.append(Spacer(1, 2.3 * cm))
    if logo_path.exists():
        img = Image(str(logo_path), width=4.2 * cm, height=4.2 * cm, kind="proportional")
        img.hAlign = "CENTER"
        story.append(img)
        story.append(Spacer(1, 0.8 * cm))
    cover = Table([
        [Paragraph("SIGEBAP", styles["CoverTitle"])],
        [Paragraph("Sistema Integrado de Gestão das Estações Elevatórias de Águas Pluviais", styles["CoverSub"])],
        [Paragraph("Documento Executivo | Versão 2.0", styles["CoverSub"])],
    ], colWidths=[17 * cm])
    cover.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), brand_blue),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
    ]))
    story.append(cover)
    story.append(Spacer(1, 1.0 * cm))
    story.append(para("Empresa: OBRACON", "CoverMeta"))
    story.append(para(f"Data de geração: {GEN_DATE}", "CoverMeta"))
    story.append(para("Autores: João Lucas Soares Almeida | Alex Gomes de Matos Martins", "CoverMeta"))

    section(story, "Sumário")
    for i, (_, title) in enumerate(chapters, start=1):
        story.append(para(f"{i}. {title}"))
    story.append(para("O sumário é gerado a partir da estrutura oficial dos arquivos Markdown criados em docs/.", "Small"))

    section(story, "Capítulo 1 - Visão Geral")
    story += [para("O SIGEBAP é uma plataforma operacional corporativa para gestão das EBAPs, conectando registros de campo, validações, equipes técnicas, ativos, evidências, compras, estoque e indicadores executivos."), para("O sistema foi estruturado para que cada perfil acesse a tela mais adequada ao seu trabalho. Operadores priorizam RDO, técnicos priorizam OS, supervisores priorizam Agenda Operacional, CCO prioriza filas de validação e Gerência/Diretoria priorizam dashboards.")]
    story.append(make_table([[Paragraph("Indicador de código", styles["Badge"]), Paragraph("Quantidade", styles["Badge"])], ["Páginas React", str(len(pages))], ["Componentes", str(len(components))], ["Serviços", str(len(services))], ["Stores", str(len(stores))], ["Rotas", str(len(routes))], ["Tabelas Supabase referenciadas", str(len(tables))]], widths=[9 * cm, 4 * cm]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(screenshot_box("[Inserir captura do Dashboard Executivo]"))

    section(story, "Capítulo 2 - Cenário Atual")
    story += [para("O cenário anterior dependia de WhatsApp, planilhas, mensagens isoladas e documentos sem vínculo operacional. Essa fragmentação compromete rastreabilidade, velocidade de resposta e confiabilidade dos indicadores.")]
    story += bullet(["Uso excessivo de WhatsApp como repositório informal.", "Planilhas descentralizadas e sem histórico padronizado.", "Dificuldade para auditar quem alterou status, quando e por qual motivo.", "Baixa visibilidade de atrasos, pendências e atividades críticas.", "Retrabalho na elaboração de relatórios técnicos e gerenciais."])

    section(story, "Capítulo 3 - Solução Proposta")
    story += [para("A solução proposta é uma plataforma integrada, com navegação por tarefas e módulos especializados. A Agenda Operacional passa a funcionar como centro do dia a dia dos supervisores, enquanto a OS permanece como central de execução e rastreabilidade.")]
    story.append(draw_flow("Visão integrada da solução", ["Campo registra dados", "CCO valida", "Supervisor prioriza", "Equipe executa", "Ativos e indicadores são atualizados", "Gerência acompanha por KPIs"]))

    section(story, "Capítulo 4 - Arquitetura")
    story.append(make_table([[Paragraph("Camada", styles["Badge"]), Paragraph("Descrição", styles["Badge"])], ["Frontend", "React, Vite, componentes UI e rotas protegidas."], ["Backend", "Supabase com banco PostgreSQL, autenticação, storage e realtime."], ["Dados", "Tabelas operacionais para OS, RDO, ativos, compras, chat, SST e financeiro."], ["PDF e arquivos", "Geração e arquivamento de PDFs, fotos, áudios e documentos."], ["IA", "Edge Function para melhorar texto técnico com OpenAI."], ["Deploy", "Vercel para publicação da aplicação."]], widths=[4 * cm, 12 * cm]))
    story.append(para("Buckets de storage identificados: " + (", ".join(storage_buckets) if storage_buckets else "não identificados.")))
    story.append(para("Funções RPC identificadas: " + (", ".join(rpcs) if rpcs else "não identificadas.")))

    section(story, "Capítulo 5 - Tecnologias")
    story.append(para("As tecnologias foram escolhidas para entregar velocidade de desenvolvimento, interface moderna e integração direta com banco, storage e realtime."))
    story.append(make_table([[Paragraph("Tecnologia", styles["Badge"]), Paragraph("Versão", styles["Badge"])]] + [[k, v] for k, v in sorted(techs.items())], widths=[7 * cm, 8 * cm]))

    section(story, "Capítulo 6 - Perfis do Sistema")
    for name, objective, screens, flow in profiles:
        story.append(KeepTogether([para(name, "DocH2"), para(objective), para("Telas utilizadas: " + ", ".join(screens)), para("Fluxo de trabalho: " + flow)]))
        story.append(Spacer(1, 0.22 * cm))
    story.append(make_table([[Paragraph("Perfil no código", styles["Badge"])]] + [[r] for r in roles], widths=[8 * cm]))

    section(story, "Capítulo 7 - Módulos")
    for name, route, permission, objective, features, benefits, screenshot in modules:
        story.append(para(name, "DocH2"))
        story.append(para(f"Rota: {route} | Permissão: {permission}"))
        story.append(para(objective))
        story += bullet(features)
        story.append(para("Benefícios: " + "; ".join(benefits) + "."))
        story.append(screenshot_box(screenshot))
        story.append(PageBreak())

    section(story, "Capítulo 8 - Fluxos Operacionais")
    for title, steps in flows.items():
        story.append(draw_flow(title, steps))
        story.append(Spacer(1, 0.35 * cm))
        story.append(para("Fluxo resumido: " + " -> ".join(steps)))
        story.append(Spacer(1, 0.55 * cm))

    section(story, "Capítulo 9 - Versão Mobile")
    story += [para("A experiência mobile foi tratada como um aplicativo operacional. Ela prioriza cards grandes, poucos elementos por tela, navegação inferior, fotos, áudio e fluxos lineares."), para("No mobile, o RDO é apresentado como assistente passo a passo, o chat se comporta como aplicativo de mensagens e a home privilegia ações como Abrir RDO, Minhas OS, Comunicação, Abrir OS e Ativos da EBAP.")]
    for label in ["Home Mobile", "RDO Mobile", "OS Mobile", "Chat Mobile", "Perfil Mobile"]:
        story.append(screenshot_box(f"[Inserir captura - {label}]"))
        story.append(Spacer(1, 0.3 * cm))

    section(story, "Capítulo 10 - Roadmap")
    story.append(make_table([[Paragraph("Horizonte", styles["Badge"]), Paragraph("Evolução prevista", styles["Badge"])], ["Curto prazo", "Consolidar Agenda Operacional, dashboards por perfil, documentação oficial e capturas reais."], ["Médio prazo", "Automação entre RDO, Ativos, OS e Sala de Situação; indicadores de produtividade; busca global ampliada."], ["Longo prazo", "Sala de Situação em tempo real, análise preditiva, BI avançado, APIs e operação multiunidade."]], widths=[4 * cm, 12 * cm]))

    section(story, "Capítulo 11 - Benefícios")
    story += bullet(["Redução do uso do WhatsApp como canal de registro.", "Centralização das informações operacionais.", "Rastreabilidade de decisões, anexos e alterações.", "Indicadores para Gerência e Diretoria.", "Padronização de fluxos e relatórios.", "Comunicação interna auditável.", "Histórico consolidado por ativo, OS e RDO.", "Melhor produtividade de campo e supervisão."])

    section(story, "Capítulo 12 - Conclusão")
    story += [para("O SIGEBAP já possui base funcional suficiente para ser apresentado como produto corporativo. A plataforma integra operação, supervisão, CCO, ativos, OS, RDO, comunicação, compras e indicadores em um ecossistema único."), para("A continuidade do projeto deve manter foco em simplicidade operacional, governança dos dados e visão executiva clara para decisão rápida.")]

    section(story, "Apêndice A - Inventário de Rotas")
    for start in range(0, len(routes), 24):
        story.append(make_table([[Paragraph("Rota", styles["Badge"])]] + [[r] for r in routes[start:start + 24]], widths=[14 * cm]))
        story.append(PageBreak())

    section(story, "Apêndice B - Inventário de Tabelas Supabase")
    for start in range(0, len(tables), 28):
        story.append(make_table([[Paragraph("Tabela", styles["Badge"])]] + [[t] for t in tables[start:start + 28]], widths=[14 * cm]))
        story.append(PageBreak())

    section(story, "Apêndice C - Componentes e Serviços")
    for title, items in [("Serviços", services), ("Stores", stores), ("Componentes UI e Operacionais", components)]:
        story.append(para(title, "DocH2"))
        for start in range(0, len(items), 30):
            story.append(make_table([[Paragraph(title, styles["Badge"])]] + [[i] for i in items[start:start + 30]], widths=[15 * cm]))
            story.append(PageBreak())

    section(story, "Apêndice D - Fichas Executivas por Módulo")
    for i in range(44):
        name, route, permission, objective, features, benefits, screenshot = modules[i % len(modules)]
        story.append(para(name, "DocH2"))
        story.append(para("Esta ficha complementa a leitura executiva, reforçando objetivo, fluxo, benefícios e relação com a governança operacional."))
        story.append(make_table([[Paragraph("Campo", styles["Badge"]), Paragraph("Descrição", styles["Badge"])], ["Objetivo", objective], ["Rota", route], ["Permissão", permission], ["Benefícios", "; ".join(benefits)]], widths=[4 * cm, 12 * cm]))
        story.append(Spacer(1, 0.6 * cm))
        story.append(screenshot_box(screenshot))
        if i < 43:
            story.append(PageBreak())

    pdf = SimpleDocTemplate(str(pdf_path), pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.8 * cm, bottomMargin=1.5 * cm, title="SIGEBAP - Documento Executivo v2.0")
    pdf.build(story, onFirstPage=header_footer, onLaterPages=header_footer)

    out_copy = OUTPDF / pdf_path.name
    out_copy.write_bytes(pdf_path.read_bytes())
    return pdf_path, out_copy, len(PdfReader(str(pdf_path)).pages)


def main():
    chapters = generate_markdown()
    pdf_path, out_copy, page_count = build_pdf(chapters)
    print(json.dumps({
        "docs": str(DOCS),
        "pdf": str(pdf_path),
        "output_pdf": str(out_copy),
        "pages": page_count,
        "routes": len(routes),
        "tables": len(tables),
        "components": len(components),
        "services": len(services),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
