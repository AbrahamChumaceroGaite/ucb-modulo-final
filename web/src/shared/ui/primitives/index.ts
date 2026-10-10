/**
 * Barril de primitivas. Solo reexporta: nunca contiene lógica.
 *
 * Se consume desde fuera (`@/shared/ui/primitives`). Los archivos se importan
 * entre sí por ruta directa, para que el barril sea una hoja del grafo y no
 * pueda cerrar un ciclo.
 *
 * ## Agrupadas por para qué sirven
 *
 * | Carpeta | Qué hay dentro |
 * |---|---|
 * | `actions/` | Lo que se pulsa: botón, expandible, acción de icono |
 * | `fields/` | Lo que se rellena: campo, entrada, desplegable, marcas, fechas, buscador, segmentado |
 * | `overlays/` | Lo que se abre encima: diálogo, panel, menú, tooltip |
 * | `navigation/` | Lo que lleva de un sitio a otro: migas, paginador, pasos |
 * | `feedback/` | Lo que dice qué está pasando: skeleton, puntos, barra de progreso |
 * | `display/` | Lo que muestra un dato suelto: etiqueta, avatar, chips |
 * | `theme/` | El interruptor de claro/oscuro |
 *
 * Veinticuatro archivos en una carpeta plana obligan a leer los veinticuatro
 * nombres para encontrar uno. Agrupados, se descarta una carpeta entera de un
 * vistazo.
 *
 * **Las carpetas y los archivos van en inglés**, como `app/`, `features/`,
 * `domain/` o `shared/`. Solo el contenido —identificadores, comentarios y
 * texto de interfaz— va en español. Tuvieron nombres en español media hora y
 * el árbol quedó a medias en dos idiomas.
 */
export { Avatar } from './display/avatar';
export { Breadcrumbs, type Miga } from './navigation/breadcrumbs';
export { ChoiceGroup } from './fields/choice-group';
export { Button } from './actions/button';
export { DatePicker, DateRangePicker } from './fields/date-picker';
export { Dialog } from './overlays/dialog';
export { Dots } from './feedback/dots';
export { Drawer, DrawerPush } from './overlays/drawer';
export { ExpandableButton } from './actions/expandable-button';
export { Field, useCampo } from './fields/field';
export { AppliedChip, FilterChips, type OpcionFiltro } from './display/filter-chips';
export { HorizontalScroller } from './display/horizontal-scroller';
export { IconAction, IconActionGroup } from './actions/icon-action';
export { Input } from './fields/input';
export { Pagination } from './navigation/pagination';
export { MenuItem, MenuSeparator, Popover } from './overlays/popover';
export { ProgressBar } from './feedback/progress-bar';
export { SearchInput } from './fields/search-input';
export { SegmentedControl } from './fields/segmented';
export { Select, Textarea } from './fields/select';
export { Skeleton, SkeletonCard, SkeletonForm, SkeletonRows, SkeletonText } from './feedback/skeleton';
export { Stepper, type Paso } from './navigation/stepper';
export { CategoryLabel, StatusDot, Tag } from './display/tag';
export { SCRIPT_TEMA, ThemeToggle } from './theme/theme-toggle';
export { Checkbox, Switch } from './fields/toggle';
export { Tooltip } from './overlays/tooltip';
