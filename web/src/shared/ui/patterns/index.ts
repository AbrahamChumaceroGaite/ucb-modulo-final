/**
 * Barril de patrones. Solo reexporta.
 *
 * Los archivos viven agrupados por para qué sirven —`shell/`, `cards/`,
 * `tables/`…—, no en una carpeta plana de trece archivos. Quien busca la
 * cabecera mira en `shell/`; quien busca la rejilla de tarjetas no tiene que
 * leer los trece nombres para descartar doce.
 *
 * Fuera de `shared/ui` **solo se importa este barril**, nunca un archivo por su
 * ruta. Así los grupos se pueden reorganizar sin tocar ninguna feature.
 */
export { AppHeader } from './shell/app-header';
export { BottomNav } from './shell/bottom-nav';
export { HeaderShell } from './shell/header-shell';
export { ChartCard, SerieAnillo, SerieArea, SerieBarras } from './charts/chart';
export { Sparkline } from './charts/sparkline';
export { ConfirmDialog } from './dialogs/confirm-dialog';
export { DataTable, type ColumnaTabla, type OrdenTabla } from './tables/data-table';
export { EmptyState } from './feedback/empty-state';
export { FilterBar, chipsDeLista, type FiltroAplicado } from './filters/filter-bar';
export { FiltroDeFecha } from './filters/date-filter';
export { ListLayout } from './shell/list-layout';
export { AddCard } from './cards/add-card';
export { CardGrid } from './cards/card-grid';
export { EntityCard } from './cards/entity-card';
export { ViewSwitcher } from './cards/view-switcher';
export { recordarVista, useVistaPreferida } from './cards/preferencia-de-vista';
export { VISTAS, type Vista } from './cards/view';
export { FormActions, FormField, FormLayout, FormRow } from './forms/form-layout';
export { FieldList } from './forms/field-list';
export {
  FormWizard,
  ResumenDato,
  ResumenGrupo,
  type PasoFormulario,
} from './forms/form-wizard';
export { HelpButton } from './help/help-button';
export { PageHeader } from './shell/page-header';
export { PanelShell } from './shell/panel-shell';
export { StatCard } from './cards/stat-card';
