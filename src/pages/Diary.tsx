import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BellRing, BookOpenText, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DiaryEntry,
  DiaryEntryPayload,
  DiaryResultEvaluation,
  DiaryTag,
  HolidayReminder,
  PaginatedDiaryResponse,
  diaryService,
} from "@/services/api";

const availableTags: { id: DiaryTag; label: string }[] = [
  { id: "chuva", label: "Chuva" },
  { id: "evento_na_cidade", label: "Evento na Cidade" },
  { id: "tarifa_dinamica", label: "Tarifa Dinamica" },
  { id: "horario_pico", label: "Horario Pico" },
];

const defaultPayload: DiaryEntryPayload = {
  date: format(new Date(), "yyyy-MM-dd"),
  isHoliday: false,
  holidayName: "",
  tags: [],
  strategyHypothesis: "",
  executionNotes: "",
  resultEvaluation: "worked_well",
  lessonsLearned: "",
};

const resultLabel: Record<DiaryResultEvaluation, string> = {
  worked_well: "Funcionou",
  partially_worked: "Funcionou Parcialmente",
  did_not_work: "Nao Funcionou",
};

const resultBadgeClass: Record<DiaryResultEvaluation, string> = {
  worked_well: "bg-green-100 text-green-700",
  partially_worked: "bg-amber-100 text-amber-700",
  did_not_work: "bg-red-100 text-red-700",
};

const formatPtDate = (value: string) => {
  try {
    return format(parseISO(value), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return value;
  }
};

const DiaryPage = () => {
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const [payload, setPayload] = useState<DiaryEntryPayload>(defaultPayload);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [sameDayHistory, setSameDayHistory] = useState<DiaryEntry[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterResult, setFilterResult] = useState<DiaryResultEvaluation | "all">("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterTag, setFilterTag] = useState<DiaryTag | "all">("all");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [holidayReminders, setHolidayReminders] = useState<HolidayReminder[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sameDayLatest = sameDayHistory[0] ?? null;

  const visibleSameDayEntries = useMemo(() => {
    if (showAllHistory) {
      return sameDayHistory;
    }
    return sameDayLatest ? [sameDayLatest] : [];
  }, [showAllHistory, sameDayHistory, sameDayLatest]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        searchTerm ||
          filterStartDate ||
          filterEndDate ||
          filterResult !== "all" ||
          filterTag !== "all"
      ),
    [filterEndDate, filterResult, filterStartDate, filterTag, searchTerm]
  );

  const loadEntries = useCallback(
    async (filters?: {
      result?: DiaryResultEvaluation;
      startDate?: string;
      endDate?: string;
      q?: string;
      tag?: DiaryTag;
      page?: number;
      pageSize?: number;
    }) => {
      const paginatedResponse: PaginatedDiaryResponse = await diaryService.getEntries(filters);
      setEntries(paginatedResponse.data);
      setPage(paginatedResponse.page);
      setPageSize(paginatedResponse.pageSize);
      setTotal(paginatedResponse.total);
      setTotalPages(paginatedResponse.totalPages);
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sameDay] = await Promise.all([diaryService.getSameDayHistory()]);
      const reminders = await diaryService.getHolidayReminders(3);
      setSameDayHistory(sameDay.entries || []);
      setHolidayReminders(reminders);
    } catch (error) {
      toast({
        title: "Erro ao carregar Diario",
        description: "Nao foi possivel buscar os registros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const filters: {
      result?: DiaryResultEvaluation;
      startDate?: string;
      endDate?: string;
      q?: string;
      tag?: DiaryTag;
      page?: number;
      pageSize?: number;
    } = {};

    if (filterResult !== "all") {
      filters.result = filterResult;
    }

    if (filterStartDate) {
      filters.startDate = filterStartDate;
    }

    if (filterEndDate) {
      filters.endDate = filterEndDate;
    }

    if (debouncedSearchTerm) {
      filters.q = debouncedSearchTerm;
    }

    if (filterTag !== "all") {
      filters.tag = filterTag;
    }

    filters.page = page;
    filters.pageSize = pageSize;

    loadEntries(filters);
  }, [
    debouncedSearchTerm,
    filterEndDate,
    filterResult,
    filterStartDate,
    filterTag,
    loadEntries,
    page,
    pageSize,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filterEndDate, filterResult, filterStartDate, filterTag, pageSize]);

  const resetForm = () => {
    setPayload(defaultPayload);
    setEditingEntryId(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !payload.strategyHypothesis.trim() ||
      !payload.executionNotes.trim() ||
      !payload.lessonsLearned.trim()
    ) {
      toast({
        title: "Campos obrigatorios",
        description: "Preencha hipotese, execucao e aprendizados.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingEntryId) {
        await diaryService.updateEntry(editingEntryId, payload);
        toast({
          title: "Registro atualizado",
          description: "O Diario foi atualizado com sucesso.",
        });
      } else {
        await diaryService.createEntry(payload);
        toast({
          title: "Registro criado",
          description: "Novo item salvo no Diario.",
        });
      }

      resetForm();
      await loadData();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Nao foi possivel salvar o registro.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntryId(entry.id);
    setPayload({
      date: entry.date,
      isHoliday: entry.isHoliday,
      holidayName: entry.holidayName || "",
      tags: entry.tags || [],
      strategyHypothesis: entry.strategyHypothesis,
      executionNotes: entry.executionNotes,
      resultEvaluation: entry.resultEvaluation,
      lessonsLearned: entry.lessonsLearned,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (entryId: number) => {
    try {
      await diaryService.deleteEntry(entryId);
      toast({
        title: "Registro removido",
        description: "Item excluido do Diario.",
      });
      if (editingEntryId === entryId) {
        resetForm();
      }
      await loadData();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Nao foi possivel remover o registro.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterResult("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterTag("all");
    setPage(1);
  };

  const duplicateEntryToToday = async (entry: DiaryEntry) => {
    try {
      const duplicatedPayload: DiaryEntryPayload = {
        date: todayIso,
        isHoliday: entry.isHoliday,
        holidayName: entry.holidayName || "",
        tags: entry.tags || [],
        strategyHypothesis: entry.strategyHypothesis,
        executionNotes: entry.executionNotes,
        resultEvaluation: entry.resultEvaluation,
        lessonsLearned: entry.lessonsLearned,
      };

      await diaryService.createEntry(duplicatedPayload);
      toast({
        title: "Estrategia duplicada",
        description: "Registro copiado para a data de hoje com sucesso.",
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Nao foi possivel duplicar a estrategia para hoje.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpenText className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Diario de Estrategias</h1>
          <p className="text-muted-foreground">
            Registre o que foi testado e recupere aprendizados rapidamente.
          </p>
        </div>
      </div>

      <Card className="p-5">
        {holidayReminders.length > 0 ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-amber-700" />
              <h3 className="text-sm font-semibold text-amber-800">
                Lembretes automaticos (3 dias antes)
              </h3>
            </div>
            <div className="space-y-2">
              {holidayReminders.map((reminder) => (
                <div key={reminder.id} className="text-sm text-amber-900">
                  Em {formatPtDate(reminder.upcomingDate)} voce tem feriado similar:{" "}
                  <strong>{reminder.holidayName}</strong>. Estrategia sugerida:{" "}
                  {reminder.strategyHypothesis}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Neste dia em anos anteriores</h2>
        </div>

        {sameDayLatest ? (
          <div className="space-y-3">
            {visibleSameDayEntries.map((entry) => (
              <div key={entry.id} className="rounded-md border p-3 bg-muted/30">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={resultBadgeClass[entry.resultEvaluation]}>
                    {resultLabel[entry.resultEvaluation]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatPtDate(entry.date)}
                  </span>
                  {entry.holidayName ? <Badge variant="outline">{entry.holidayName}</Badge> : null}
                </div>
                <p className="text-sm">
                  <strong>Hipotese:</strong> {entry.strategyHypothesis}
                </p>
                <p className="text-sm mt-1">
                  <strong>Aprendizado:</strong> {entry.lessonsLearned}
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => duplicateEntryToToday(entry)}
                  >
                    Duplicar estrategia para hoje
                  </Button>
                </div>
              </div>
            ))}

            {sameDayHistory.length > 1 ? (
              <Button
                variant="outline"
                onClick={() => setShowAllHistory((current) => !current)}
              >
                {showAllHistory
                  ? "Mostrar apenas o mais recente"
                  : `Ver todos os anos (${sameDayHistory.length})`}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum registro encontrado para esta data em anos passados.
          </p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingEntryId ? "Editar registro" : "Novo registro"}
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={payload.date}
                onChange={(event) =>
                  setPayload((current) => ({ ...current, date: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Resultado</label>
              <Select
                value={payload.resultEvaluation}
                onValueChange={(value: DiaryResultEvaluation) =>
                  setPayload((current) => ({ ...current, resultEvaluation: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worked_well">Funcionou</SelectItem>
                  <SelectItem value="partially_worked">Funcionou Parcialmente</SelectItem>
                  <SelectItem value="did_not_work">Nao Funcionou</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isHoliday"
              checked={payload.isHoliday}
              onCheckedChange={(checked) =>
                setPayload((current) => ({ ...current, isHoliday: checked === true }))
              }
            />
            <label htmlFor="isHoliday" className="text-sm font-medium">
              Foi um feriado
            </label>
          </div>

          {payload.isHoliday ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do feriado (opcional)</label>
              <Input
                type="text"
                placeholder="Ex: Tiradentes"
                value={payload.holidayName || ""}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    holidayName: event.target.value,
                  }))
                }
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags de contexto</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = (payload.tags || []).includes(tag.id);
                return (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setPayload((current) => {
                        const currentTags = current.tags || [];
                        return {
                          ...current,
                          tags: currentTags.includes(tag.id)
                            ? currentTags.filter((item) => item !== tag.id)
                            : [...currentTags, tag.id],
                        };
                      })
                    }
                  >
                    {tag.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hipotese da estrategia</label>
            <Textarea
              placeholder="Qual era a ideia antes de executar?"
              value={payload.strategyHypothesis}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  strategyHypothesis: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Execucao</label>
            <Textarea
              placeholder="Como voce executou a estrategia no dia?"
              value={payload.executionNotes}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  executionNotes: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Aprendizados</label>
            <Textarea
              placeholder="O que manter, mudar ou evitar no proximo ano?"
              value={payload.lessonsLearned}
              onChange={(event) =>
                setPayload((current) => ({
                  ...current,
                  lessonsLearned: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {editingEntryId ? "Atualizar Registro" : "Salvar Registro"}
            </Button>
            {editingEntryId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar Edicao
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Historico do Diario</h2>
        <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input
            type="text"
            placeholder="Buscar por texto..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select
            value={filterResult}
            onValueChange={(value: DiaryResultEvaluation | "all") => setFilterResult(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os resultados</SelectItem>
              <SelectItem value="worked_well">Funcionou</SelectItem>
              <SelectItem value="partially_worked">Funcionou Parcialmente</SelectItem>
              <SelectItem value="did_not_work">Nao Funcionou</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterStartDate}
            onChange={(event) => setFilterStartDate(event.target.value)}
          />
          <Input
            type="date"
            value={filterEndDate}
            onChange={(event) => setFilterEndDate(event.target.value)}
          />
        </div>
        <div className="mb-4">
          <Select
            value={filterTag}
            onValueChange={(value: DiaryTag | "all") => setFilterTag(value)}
          >
            <SelectTrigger className="w-full md:w-72">
              <SelectValue placeholder="Filtrar por tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {total} registro(s) encontrado(s)
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
        {entries.length === 0 ? (
          <p className="text-muted-foreground">Nenhum registro cadastrado ate agora.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={resultBadgeClass[entry.resultEvaluation]}>
                      {resultLabel[entry.resultEvaluation]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatPtDate(entry.date)}
                    </span>
                    {entry.holidayName ? (
                      <Badge variant="outline">{entry.holidayName}</Badge>
                    ) : null}
                    {(entry.tags || []).map((tag) => (
                      <Badge key={`${entry.id}-${tag}`} variant="outline">
                        {availableTags.find((item) => item.id === tag)?.label || tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                <p className="text-sm">
                  <strong>Hipotese:</strong> {entry.strategyHypothesis}
                </p>
                <p className="text-sm mt-1">
                  <strong>Execucao:</strong> {entry.executionNotes}
                </p>
                <p className="text-sm mt-1">
                  <strong>Aprendizados:</strong> {entry.lessonsLearned}
                </p>
                {hasActiveFilters ? null : (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => duplicateEntryToToday(entry)}
                    >
                      Duplicar estrategia para hoje
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por pagina</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={page >= totalPages}
            >
              Proxima
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DiaryPage;
