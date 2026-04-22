import React, { useState, useCallback, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  importService,
  type ImportedStatement,
  type ImportedStatementDetail,
} from "@/services/api";

// ============================================================
// Componente de Upload com Drag & Drop
// ============================================================

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isUploading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
        e.target.value = "";
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed p-8 md:p-12
        transition-all duration-300 ease-out cursor-pointer group
        ${
          isDragging
            ? "border-emerald-400 bg-emerald-500/10 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-emerald-400/50 bg-card/50 hover:bg-card/80"
        }
        ${isUploading ? "pointer-events-none opacity-60" : ""}
      `}
      onClick={() => !isUploading && document.getElementById("pdf-upload-input")?.click()}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex flex-col items-center gap-4 text-center">
        {isUploading ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            </div>
            <p className="text-lg font-medium text-foreground">Processando PDF...</p>
            <p className="text-sm text-muted-foreground">Extraindo dados do extrato Uber</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors duration-300">
              <Upload className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-1">
                Arraste o PDF do extrato Uber aqui
              </p>
              <p className="text-sm text-muted-foreground">
                ou clique para selecionar o arquivo • Apenas arquivos .pdf
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>
                Baixe o extrato em{" "}
                <a
                  href="https://drivers.uber.com/earnings/statements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  drivers.uber.com
                </a>
              </span>
            </div>
          </>
        )}
      </div>

      <input
        id="pdf-upload-input"
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleInputChange}
        disabled={isUploading}
      />
    </div>
  );
};

// ============================================================
// Card de Extrato Importado
// ============================================================

interface StatementCardProps {
  statement: ImportedStatement;
  onViewDetails: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

const StatementCard: React.FC<StatementCardProps> = ({
  statement,
  onViewDetails,
  onDelete,
  isDeleting,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const statusConfig = {
    completed: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Concluído" },
    processing: { icon: Loader2, color: "text-amber-400", bg: "bg-amber-500/10", label: "Processando" },
    error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Erro" },
  };

  const status = statusConfig[statement.importStatus] || statusConfig.processing;
  const StatusIcon = status.icon;

  return (
    <div className="group relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 hover:border-border transition-all duration-300 hover:shadow-lg hover:shadow-black/5">
      {/* Status badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${statement.importStatus === "processing" ? "animate-spin" : ""}`} />
          {status.label}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onViewDetails(statement.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-400"
            onClick={() => onDelete(statement.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Period */}
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium text-foreground">
          {formatDate(statement.periodStart)} — {formatDate(statement.periodEnd)}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Ganhos</p>
          <p className="text-lg font-bold text-emerald-400">{formatMoney(statement.totalEarnings)}</p>
        </div>
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/10 p-3">
          <p className="text-xs text-muted-foreground mb-0.5">Viagens</p>
          <p className="text-lg font-bold text-cyan-400">{statement.tripsCount}</p>
        </div>
      </div>

      {/* Error message */}
      {statement.importStatus === "error" && statement.errorMessage && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400">{statement.errorMessage}</p>
        </div>
      )}

      {/* Filename */}
      <p className="mt-3 text-xs text-muted-foreground/60 truncate" title={statement.originalFilename}>
        📄 {statement.originalFilename}
      </p>
    </div>
  );
};

// ============================================================
// Modal de Detalhes
// ============================================================

interface DetailModalProps {
  detail: ImportedStatementDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ detail, isLoading, onClose }) => {
  const [showBreakdown, setShowBreakdown] = useState(true);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "—";
    return timeStr.substring(0, 5);
  };

  const serviceColors: Record<string, string> = {
    UberX: "bg-slate-500/20 text-slate-300",
    Comfort: "bg-blue-500/20 text-blue-300",
    Priority: "bg-purple-500/20 text-purple-300",
    Flash: "bg-amber-500/20 text-amber-300",
    Black: "bg-zinc-500/20 text-zinc-200",
    Green: "bg-emerald-500/20 text-emerald-300",
    Moto: "bg-orange-500/20 text-orange-300",
    Pet: "bg-pink-500/20 text-pink-300",
  };

  if (!detail && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-border/50 bg-card/95 backdrop-blur-sm rounded-t-2xl">
          <h2 className="text-lg font-semibold text-foreground">Detalhes do Extrato</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando detalhes...</p>
          </div>
        ) : detail ? (
          <div className="p-5 space-y-5">
            {/* Period and Summary */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-5">
              <p className="text-xs text-muted-foreground mb-1">Período</p>
              <p className="text-lg font-bold text-foreground mb-4">
                {formatDate(detail.periodStart)} — {formatDate(detail.periodEnd)}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Ganhos</p>
                  <p className="text-base font-bold text-emerald-400">{formatMoney(detail.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagamentos</p>
                  <p className="text-base font-bold text-foreground">{formatMoney(detail.totalPayouts)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Inicial</p>
                  <p className="text-base font-bold text-foreground">{formatMoney(detail.startingBalance)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Final</p>
                  <p className="text-base font-bold text-foreground">{formatMoney(detail.endingBalance)}</p>
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <span className="text-sm font-medium text-foreground">Detalhamento dos Ganhos</span>
                {showBreakdown ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {showBreakdown && (
                <div className="px-4 pb-4 space-y-2">
                  {[
                    { label: "Base", value: detail.fareBase, color: "text-foreground" },
                    { label: "Surge", value: detail.fareSurge, color: "text-amber-400" },
                    { label: "Priority", value: detail.farePriority, color: "text-purple-400" },
                    { label: "Tempo de Espera", value: detail.fareWaitTime, color: "text-cyan-400" },
                  ].map(
                    (item) =>
                      item.value > 0 && (
                        <div key={item.label} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className={`text-sm font-medium ${item.color}`}>{formatMoney(item.value)}</span>
                        </div>
                      )
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-sm font-medium text-foreground">Total</span>
                    <span className="text-sm font-bold text-emerald-400">{formatMoney(detail.totalEarnings)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Trips List */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                Viagens ({detail.trips.length})
              </h3>
              <div className="space-y-2">
                {detail.trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${serviceColors[trip.serviceType] || "bg-muted text-muted-foreground"}`}>
                        {trip.serviceType}
                      </span>
                      <div>
                        <p className="text-sm text-foreground">{formatDate(trip.tripDate)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(trip.startTime)} → {formatTime(trip.tripTime)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">{formatMoney(trip.earnings)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-integrated badge */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400">
              <Info className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">
                Dados importados — não integrados aos cálculos e estatísticas do sistema.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ============================================================
// Página Principal de Importação
// ============================================================

const Import: React.FC = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [statements, setStatements] = useState<ImportedStatement[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ImportedStatementDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadStatements = useCallback(async (pageNum: number = 1) => {
    setIsLoadingList(true);
    try {
      const response = await importService.getStatements({ page: pageNum, pageSize: 12 });
      setStatements(response.data);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error("Erro ao carregar importações:", error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadStatements();
  }, [loadStatements]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const result = await importService.uploadPdf(file);
        toast({
          title: "Extrato importado!",
          description: `${result.summary.tripsCount} viagens extraídas — ${result.summary.period}`,
        });
        loadStatements(1);
      } catch (error: any) {
        const message = error.response?.data?.message || "Erro ao processar o PDF.";
        toast({
          title: "Erro na importação",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [toast, loadStatements]
  );

  const handleViewDetails = useCallback(async (id: number) => {
    setShowDetail(true);
    setIsLoadingDetail(true);
    try {
      const detail = await importService.getStatementDetail(id);
      setSelectedDetail(detail);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm("Tem certeza que deseja excluir este extrato e todas as viagens importadas?")) return;

      setDeletingId(id);
      try {
        await importService.deleteStatement(id);
        toast({
          title: "Extrato excluído",
          description: "O extrato e suas viagens foram removidos.",
        });
        loadStatements(page);
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o extrato.",
          variant: "destructive",
        });
      } finally {
        setDeletingId(null);
      }
    },
    [toast, loadStatements, page]
  );

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setSelectedDetail(null);
  }, []);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Totals
  const totalEarnings = statements.reduce((sum, s) => sum + s.totalEarnings, 0);
  const totalTrips = statements.reduce((sum, s) => sum + s.tripsCount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Importar Extratos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload dos PDFs de extratos semanais da Uber para visualizar seus dados.
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-400">Dados não integrados</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Os dados importados são apenas para visualização. Eles não afetam as estatísticas, cálculos ou
            relatórios do sistema. Para registrar ganhos oficiais, use "Nova Viagem".
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />

      {/* Stats Summary */}
      {statements.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Extratos</p>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
          <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Ganhos</p>
            <p className="text-2xl font-bold text-emerald-400">{formatMoney(totalEarnings)}</p>
          </div>
          <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Viagens</p>
            <p className="text-2xl font-bold text-cyan-400">{totalTrips}</p>
          </div>
        </div>
      )}

      {/* Statements List */}
      <div>
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : statements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-base font-medium text-foreground mb-1">Nenhum extrato importado</p>
              <p className="text-sm text-muted-foreground">
                Faça upload de um PDF de extrato semanal da Uber para começar.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statements.map((statement) => (
                <StatementCard
                  key={statement.id}
                  statement={statement}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDelete}
                  isDeleting={deletingId === statement.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadStatements(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadStatements(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <DetailModal
          detail={selectedDetail}
          isLoading={isLoadingDetail}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default Import;
