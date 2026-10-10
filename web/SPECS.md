# Especificaciones verificadas

Cada fila de este documento es **una promesa del sistema y la prueba que la
sostiene**. Si una promesa no tiene prueba, aparece igual, en la sección de
«Sin cubrir» — porque lo que no se dice se supone, y lo que se supone se
rompe.

```bash
npm run test          # una vez
npx vitest            # en vigilancia, mientras se trabaja
npm run check         # tipos, lint, tokens, código muerto y pruebas
```

- **Runner:** Vitest 3 sobre `jsdom`, con Testing Library.
- **Dónde viven:** al lado de lo que prueban, como `<archivo>.test.ts(x)`. No
  hay carpeta `__tests__`: un archivo de prueba lejos del código es un archivo
  que nadie abre cuando cambia el código.
- **Convención de nombre:** el `it` describe **la promesa en una frase**, no
  el método. «no avanza si el campo del paso no es válido», no «test trigger».

---

## 1. Qué se prueba y qué no

Se escribe una prueba cuando el código **afirma un comportamiento**.

| Se prueba | Por qué |
|---|---|
| Reglas de negocio | Cambiar un umbral tiene que doler en algún sitio |
| Traducciones con trampa | `undefined` no viaja, `null` sí: invisible a simple vista |
| Promesas de interfaz | «El diálogo no cierra al pulsar fuera» es una afirmación |
| Accesibilidad afirmada | Si digo que va con el teclado, hay que pulsarlo |
| Defectos ya cometidos | Una regresión no se descubre dos veces |

**No** se prueba que un `div` tenga una clase, ni que un componente renderice
sin explotar. Si una prueba solo repite el JSX, sobra y estorba al rediseño.

> Una prueba verde tampoco justifica que el código exista: `audit-muertos`
> marca como resto lo que **solo** usa su propia prueba.

---

## 2. Las especificaciones

### 2.1 Contrato con la API — `src/shared/api/`

**`paginated.test.ts`** · 6 pruebas

| Promesa |
|---|
| La primera página es la 1, no la 0 |
| La página se **deriva** de `skip`/`limit`; no se guarda aparte |
| Un `limit` de cero no divide por cero |
| El total de páginas redondea hacia arriba: una fila suelta ocupa página |
| Sin resultados sigue habiendo una página, la vacía |
| `Paginado<T>` y `paginadoSchema` no se pueden separar (comprobación de tipos) |

### 2.2 Actualizaciones parciales — `src/shared/lib/`

**`to-patch.test.ts`** · 6 pruebas — *el bug más caro que encontramos auditando*

| Promesa |
|---|
| Lo que no cambió no se manda |
| Solo viaja el campo que cambió |
| `undefined` significa «no lo toques» y **no** viaja |
| `null` significa «bórralo» y **sí** viaja, con su clave presente |
| Si el original ya era nulo, seguir nulo no es un cambio |
| Los arrays se comparan elemento a elemento, no por referencia |

### 2.3 Reglas de negocio — `src/features/`

**`productos/domain/producto.schema.test.ts`** · 5 pruebas

| Promesa |
|---|
| Por debajo del mínimo, el nivel es crítico |
| Justo en el mínimo **sigue** siendo crítico: quedarse al borde es quedarse corto |
| Hasta una vez y media el mínimo es bajo |
| Por encima, suficiente |
| Sin mínimo declarado no hay nada de que avisar |

**`productos/domain/producto.filtros.test.ts`** · 10 pruebas

| Promesa |
|---|
| Sin filtros se devuelve todo, incluidos los dados de baja |
| «Activos» esconde los dados de baja; «Dados de baja» enseña solo esos |
| **Elegir los dos estados es lo mismo que no elegir ninguno** |
| La categoría acota por **id**, no por nombre |
| **Varias categorías se acumulan: es una unión, no una intersección** |
| Un producto sin categoría no entra al filtrar por categoría |
| «Se vende» y «Solo despensa» son dos subconjuntos distintos |
| Filtros **distintos** sí se cruzan entre ellos |
| No muta la lista que recibe |

**`productos/domain/producto.mapper.test.ts`** · 7 pruebas

| Promesa |
|---|
| El formulario recibe los **ids** de categoría y unidad, no sus nombres |
| Un producto sin padre llega al formulario como texto vacío |
| Sin cambios no se manda nada |
| Solo viaja el campo que cambió |
| Vaciar «presentación de» manda el borrado del padre, no lo omite |
| Los números llegan como números, no como texto |
| Las referencias nulas del backend no rompen el aplanado |

**`personal/domain/persona.schema.test.ts`** · 8 pruebas

| Promesa |
|---|
| Una persona completa pasa |
| El teléfono es opcional: vacío vale |
| Si se pone, tiene que ser boliviano (8 dígitos, empieza por 6 o 7) |
| El mensaje dice **qué se espera**, no «inválido» |
| El carnet es obligatorio y de al menos cinco caracteres |
| Nombres y apellidos no pueden ser espacios |
| El teléfono **no** se transforma a `null`: el formulario maneja texto |
| `nombreCompleto` une nombres y apellidos, que en la base no existen juntos |

**`personal/domain/personal.filtros.test.ts`** · 8 pruebas

| Promesa |
|---|
| `esUsuario` distingue por el rol, lo único que un cliente no tiene |
| Sin filtros se devuelve todo, incluidos los dados de baja |
| «Activos» esconde los dados de baja; «baja» enseña solo esos |
| El rol acota a los de ese rol, y **varios roles se acumulan** |
| Los dos filtros se suman |
| El rol **se ignora sobre clientes**: no tienen, y devolver cero parecería un fallo |
| No muta la lista que recibe |

**`personal/domain/personal.mapper.test.ts`** · 9 pruebas

| Promesa |
|---|
| El formulario recibe la persona aplanada y el **id** del rol, no su nombre |
| Un teléfono nulo llega al formulario como texto vacío |
| Sin cambios no se manda nada |
| Solo viaja el campo que cambió |
| **La contraseña en blanco no viaja**: significa «no la toques» |
| Una contraseña escrita sí viaja, aunque el resto no cambie |
| Cambiar de rol manda el id, no el nombre |
| El formulario de cliente es solo la persona: ni correo ni rol |
| El PATCH de cliente manda solo lo que cambió |

**`auth/domain/perfil.test.ts`** · 5 pruebas

| Promesa |
|---|
| Reconoce al administrador escrito de varias formas |
| Reconoce al operador escrito de varias formas |
| No se deja engañar por acentos ni mayúsculas |
| **Devuelve `null` si no reconoce**, en vez de adivinar |
| Cada perfil entra por una puerta distinta |

**`vencimientos/domain/evaluacion.schema.test.ts`** · 5 pruebas

| Promesa |
|---|
| La respuesta del servicio se acepta tal cual llega |
| **Un nivel que el servicio no conoce revienta en el borde, con el nombre del campo** |
| El consumo de 28 días puede faltar: un insumo nuevo no tiene cuatro semanas de historia |
| Las reglas que cruzan campos señalan **el campo que hay que corregir** |
| Un lote vacío no se evalúa |

**`vencimientos/domain/evaluacion.lectura.test.ts`** · 10 pruebas

| Promesa |
|---|
| El vencimiento se dice en palabras: hoy, mañana, en N días |
| Lo que queda se dice como cantidad, no como porcentaje |
| **Cuando la regla y el modelo discrepan, se dice** |
| **Sin consumo registrado la regla no opina: ni coincide ni discrepa** |
| El sobrante: «se termina» si es cero, la cantidad si sobra, nada si no se sabe |
| La cobertura topada (999) no es un plazo: es que no se está usando |
| Una categoría desconocida se enseña tal cual, no se esconde |
| Las falsas alarmas salen de la precisión de prueba |
| **Por debajo del 1 % no dice «0%»**: un modelo no da certezas |
| El pie de la tarjeta: primero la discrepancia, luego el sobrante, si no nada |

**`vencimientos/domain/evaluacion.filtros.test.ts`** · 2 pruebas

| Promesa |
|---|
| Sin filtros solo viaja la paginación |
| Las listas viajan separadas por comas y las fechas con el nombre que espera la API |

**`vencimientos/domain/evaluacion.mapper.test.ts`** · 3 pruebas

| Promesa |
|---|
| «Revisar de nuevo» copia el lote y mueve la revisión a hoy |
| Lo que arma es un formulario válido mientras el lote no haya vencido |
| **Si ya venció, el formulario lo dice en vez de evaluar a ciegas** |

**`shared/lib/fecha-local.test.ts`** · 3 pruebas

| Promesa |
|---|
| `AAAA-MM-DD` → `Date` → `AAAA-MM-DD` sin perder un día |
| El `Date` es el día del texto **en hora local** |
| Lo que no tiene la forma `AAAA-MM-DD` no es una fecha |

### 2.4 Promesas de interfaz — `src/shared/ui/`

**`primitives/overlays/dialog.test.tsx`** · 5 pruebas — *regla 8.8*

| Promesa |
|---|
| **NO** se cierra al pulsar fuera |
| El velo no es pulsable ni tabulable: no hay un «Cerrar» invisible |
| Sí se cierra con `Escape` |
| Sí se cierra con la equis |
| Cerrado no deja nada en el DOM |

**`primitives/overlays/drawer.test.tsx`** · 5 pruebas — *regresión de un defecto real*

| Promesa |
|---|
| Con ancho de sobra, `DrawerPush` **no monta** ninguna hoja modal |
| Con ancho de sobra **no bloquea el desplazamiento** de la página |
| En estrecho sí es una hoja modal, que es lo que el espacio permite |
| `Drawer` cerrado no deja nada en el DOM ni toca el desplazamiento |
| `Drawer` abierto **sí** cierra al pulsar el velo: es para mirar, no para escribir |

**`primitives/fields/segmented.test.tsx`** · 3 pruebas

| Promesa |
|---|
| Se anuncia como grupo de radios con su nombre |
| **Cambia con las flechas del teclado**, sin tocar el ratón |
| Una opción de solo icono conserva su nombre accesible |

**`primitives/fields/choice-group.test.tsx`** · 4 pruebas

| Promesa |
|---|
| En modo único es un grupo de radios y **enseña el porqué** de cada opción |
| Elegir sustituye, no acumula |
| En modo múltiple son casillas y sí acumulan |
| En modo múltiple, volver a pulsar quita |

**`primitives/fields/input.test.tsx`** · 5 pruebas

| Promesa |
|---|
| `soloDigitos` descarta las letras al teclear |
| Descarta también **lo que se pega**, que es por donde se cuela |
| Avisa al formulario con el valor ya limpio, no con el original |
| Se anuncia como numérico para que el móvil abra el teclado de cifras |
| Sin la prop, el campo acepta lo que sea |

**`patterns/forms/form-wizard.test.tsx`** · 10 pruebas — *regla 10.3*

| Promesa |
|---|
| No avanza si el campo del paso no es válido, y dice por qué |
| Avanza cuando el campo del paso es válido |
| El resumen enseña lo tecleado y **solo desde ahí** se envía |
| `Enter` en un campo no envía desde un paso intermedio |
| Un envío nativo del formulario no guarda nada, venga de donde venga |
| Ni siquiera desde la revisión: guardar es una llamada explícita |
| **Ningún botón del asistente puede enviar por activación** (`type="submit"`: cero) |
| Mientras se guarda no se puede navegar a otro paso |
| El botón de envío enseña los puntos, no su texto, mientras guarda |
| Volver a un paso completado conserva lo tecleado |

---

**`lib/params-lista.test.ts`** · 8 pruebas — *regla 8.15*

| Promesa |
|---|
| Sin el parámetro, no hay nada puesto |
| Lee varios valores de un parámetro |
| Un parámetro vacío no produce un valor vacío |
| La lista vacía **borra** el parámetro en vez de dejarlo en blanco |
| Lo escrito se vuelve a leer igual: el enlace no miente |
| Pulsar un chip que no estaba lo añade; uno que ya estaba, lo quita |
| No muta la lista que recibe |

**`primitives/display/filter-chips.test.tsx`** · 6 pruebas — *regla 8.15*

| Promesa |
|---|
| Se anuncia como un grupo con su nombre |
| Pulsar un chip lo **añade** a lo que ya había, no lo sustituye |
| Pulsar un chip que ya estaba lo quita |
| Varios chips pueden estar puestos a la vez (`aria-pressed`) |
| «Todas» está activo justo cuando no hay nada elegido |
| «Todas» no se añade a la lista: **la vacía** |

**`lib/format.test.ts`** · 11 pruebas — *regla 2.9*

| Promesa |
|---|
| `formatearFechaHora` escribe día, mes, año y hora |
| **Una venta de las 22:40 sigue siendo del día 21, no del 22** |
| Una de las 00:30 sigue siendo del día que dice |
| Sin fecha devuelve un guion, no «Invalid Date» |
| Con algo que no tiene esa forma devuelve un guion en vez de adivinar |
| **`formatearFecha('2026-09-21')` no retrocede un día por interpretarla en UTC** |
| El primero de enero no se va al año anterior |
| Una fecha con hora se sigue formateando, y un `Date` se sigue aceptando |
| Un porcentaje se redondea al entero: una probabilidad estimada no tiene centésimas de verdad |
| El intervalo de un chip de fechas, con los dos extremos o con uno solo |

**`patterns/cards/preferencia-de-vista.test.ts`** · 9 pruebas — *regla 8.11*

| Promesa |
|---|
| Sin nada en la URL ni guardado, la rejilla |
| **Lo que dice la URL manda**, aunque haya otra cosa guardada |
| Sin nada en la URL, la última que se eligió |
| La preferencia es **por pantalla**: productos no hereda la de ventas |
| Una vista inventada —en la URL o guardada— no se respeta |
| Elegir otra vista se refleja sin recargar |
| Si el navegador no deja leer ni escribir, no revienta |

**`patterns/filters/filter-bar.test.tsx`** · 3 pruebas — *regla 8.11*

| Promesa |
|---|
| Con ancho de sobra los filtros están en línea y **no hay ninguna hoja montada** |
| En estrecho se pliegan tras un botón que dice cuántos hay puestos |
| La hoja enseña **los mismos** filtros, no una segunda versión |

**`recetas/domain/receta.schema.test.ts`** · 9 pruebas

| Promesa |
|---|
| `tandasPosibles` manda el ingrediente que menos alcanza |
| No parte tandas: con lo justo para media, sale cero |
| **Devuelve `null` si un ingrediente no está en la despensa: es «no lo sé», no «no hay»** |
| Una receta sin ingredientes vigentes no se puede evaluar |
| Un ingrediente dado de baja no limita: ya no es parte de la receta |
| Un ingrediente de cantidad cero no vuelve infinito el resultado |
| `ingredientesQueFaltan` señala solo los que no llegan a una tanda |
| Lo que no está en la despensa no se declara faltante |
| Lo dado de baja no falta |

**`recetas/domain/receta.filtros.test.ts`** · 7 pruebas

| Promesa |
|---|
| Sin filtros devuelve todo, incluidas las dadas de baja |
| «Activas» esconde las dadas de baja |
| Elegir los dos estados es lo mismo que no elegir ninguno |
| El producto obtenido acota por id |
| Varios productos se acumulan: es una unión |
| Filtros distintos sí se cruzan |
| No muta la lista que recibe |

**`recetas/domain/receta.mapper.test.ts`** · 7 pruebas

| Promesa |
|---|
| **Ordena los pasos por su número**: el orden es el significado de un paso |
| Deja fuera lo dado de baja, que si no reaparecería al guardar |
| No arrastra los ids de ingredientes ni pasos: el alta no los acepta |
| Sin cambios no manda nada |
| Solo viaja el campo que cambió |
| Cambiar un ingrediente manda la lista entera: la API no acepta medias listas |
| Reordenar los pasos cuenta como cambio |

**`ventas/domain/venta.schema.test.ts`** · 7 pruebas

| Promesa |
|---|
| `subtotalDeLinea` multiplica precio por cantidad |
| **El descuento resta sobre el importe de la línea, no sobre el precio** |
| Un descuento mayor que la línea no genera dinero a devolver |
| Aguanta decimales, que es como son los precios de verdad |
| `totalProvisional` suma las líneas ya con su descuento |
| Sin líneas es cero, no `NaN` |
| `lineasVigentes` deja fuera las dadas de baja |

**`ventas/domain/venta.filtros.test.ts`** · 13 pruebas

| Promesa |
|---|
| Sin filtros devuelve todo, incluidas las dadas de baja |
| «Activas» esconde las anuladas |
| El estado de venta acota por id, y varios se acumulan |
| «Desde» y «hasta» incluyen su propio día |
| Los dos extremos acotan un intervalo cerrado |
| **Una venta de las 22:40 no se va al día siguiente** |
| La fecha se cruza con los demás filtros |
| No muta la lista que recibe |
| `totalDeLoMostrado` suma lo que se está viendo |
| **Una venta anulada no suma: no es dinero que entró** |
| Sin filas es cero, no `NaN` |

**`ventas/domain/venta.mapper.test.ts`** · 9 pruebas

| Promesa |
|---|
| **No arrastra lo que calcula el servidor**: ni total ni subtotales |
| No arrastra el vendedor ni la fecha: los ponen la sesión y el servidor |
| Deja fuera las líneas dadas de baja |
| El estado llega como su id, no como su nombre |
| Una venta sin cliente llega al formulario como texto vacío, no como `null` |
| Sin cambios no manda nada |
| Solo viaja el campo que cambió |
| Cambiar una línea manda la lista entera |
| Quitar el cliente sí viaja: «sin cliente» es una decisión |

**`ventas/domain/venta.resumen.test.ts`** · 12 pruebas — lo que alimenta los gráficos

| Promesa |
|---|
| `ingresoPorDia` agrupa por día y ordena cronológicamente |
| **Una venta de la noche cuenta en su propio día** |
| Una venta anulada no suma, y un día con solo anuladas no aparece |
| Sin ventas, una serie vacía y no `NaN` |
| `ventasPorEstado` cuenta de más a menos, y **aquí las anuladas sí cuentan** |
| Una venta sin estado se agrupa aparte, no se pierde |
| `ingresoPorProducto` suma por **importe**, no por unidades |
| Las líneas dadas de baja y las ventas anuladas no cuentan |
| Recorta a los que se piden |
| Un id sin nombre resuelto se enseña tal cual, no se inventa |

**`ventas/domain/venta.reporte.test.ts`** · 10 pruebas — el CSV

| Promesa |
|---|
| Abre con la fila de cabeceras |
| Parte fecha y hora **sin construir un `Date`** |
| Una venta sin cliente dice «Mostrador»; con cliente, su nombre |
| Los importes llevan coma decimal, que es lo que Excel espera en `es-BO` |
| Las anuladas salen marcadas, no se esconden |
| **El total de cierre no cuenta las anuladas** |
| Entrecomilla lo que lleva el separador y duplica las comillas de dentro |
| El nombre del archivo lleva fecha y hora |

### 2.5 El flujo de una pantalla de lista — `src/features/*/presentation/`

Estas dos son **pruebas de integración**: montan la vista entera contra el
puerto falso —el mismo que usa la aplicación con `USAR_MOCKS`— con un
`QueryClientProvider` y un `next/navigation` vivo (`shared/testing/
router-falso.tsx`), que cambia la consulta **y repinta**, como el de verdad.

Son las mismas cinco preguntas en las dos pantallas, a propósito: que dos
vistas se parezcan en el código no prueba que compartan composición —dos
copias también se parecen—. Que la misma prueba describa a las dos, sí.

**`productos/presentation/producto.view.test.tsx`** · 6 pruebas

| Promesa |
|---|
| Pide la colección al puerto y pinta lo que llega (las filas del Excel) |
| La vista de tabla enseña la misma colección en filas, **con su columna de acciones** — *regla 8.10* |
| La ficha se abre con los datos de la fila pulsada, no con los de la primera |
| **Acota por varias categorías a la vez**, y las dos quedan en la dirección |
| **«Todas» limpia el grupo** en vez de añadirse a él |
| Lo que se mira se escribe en la dirección, no se guarda dentro — *regla 8.11* |

**`recetas/presentation/receta.view.test.tsx`** · 7 pruebas

| Promesa |
|---|
| Pide la colección al puerto y pinta lo que llega |
| La vista de tabla enseña la misma colección en filas, con sus acciones |
| La ficha se abre con los datos de la fila pulsada, no con los de la primera |
| Acota por varios productos a la vez, y los dos quedan en la dirección |
| Lo que se mira se escribe en la dirección |
| **Resuelve los ids de producto a nombres**: el backend solo manda ids |
| La ficha enseña los pasos **en orden**, no en el orden en que llegaron |

**`ventas/presentation/venta.view.test.tsx`** · 12 pruebas

| Promesa |
|---|
| Pide la colección al puerto y pinta lo que llega |
| La vista de tabla enseña la misma colección en filas, con sus acciones |
| La ficha se abre con los datos de la fila pulsada |
| Acota por varios estados a la vez, y los dos quedan en la dirección |
| Lo que se mira se escribe en la dirección |
| Resuelve los ids de cliente a nombres |
| **Una venta sin cliente dice «Mostrador», no deja un hueco** |
| **Suma lo que se está mirando, y la suma cambia al acotar** |
| **El filtro de fecha está encendido aquí**, al revés que en las otras tres |
| El reporte descarga un archivo con nombre fechado |
| **Mientras prepara, el botón queda ocupado y un segundo clic no descarga otra vez** — el clic se dispara a mano, porque lo que se comprueba es la guardia del caso de uso y no el `disabled` |
| El resumen se abre desde la cabecera y queda en la dirección |

**`personal/presentation/personal.view.test.tsx`** · 6 pruebas

| Promesa |
|---|
| Pide la colección al puerto y pinta lo que llega |
| La vista de tabla enseña la misma colección en filas, con sus acciones |
| La ficha se abre con los datos de la fila pulsada, no con los de la primera |
| **Acota por varios roles a la vez**, y los dos quedan en la dirección |
| Lo que se mira se escribe en la dirección |
| Cambiar de pestaña cambia de colección, y eso también vive en la URL |

**`vencimientos/presentation/vencimiento.view.test.tsx`** · 7 pruebas — *sin mock: el único doble es `fetch`*

| Promesa |
|---|
| Pinta lo que devuelve el servicio, **con la ficha del modelo al lado** (recall del modelo y de la regla) |
| Dice, en la tarjeta, dónde el modelo y la regla no coinciden |
| **El filtro de riesgo viaja al servidor** y queda en la dirección |
| La tabla enseña lo mismo que la tarjeta: riesgo, regla y acciones — *regla 8.10* |
| **Si el servicio está caído lo dice, y no enseña ni un número inventado** |
| Revisar de nuevo: mismo lote, revisión de hoy, y al terminar **abre la respuesta** |
| Quitar pide confirmación y manda el `DELETE` de esa evaluación |

---

### 2.6 Auditorías del código, no pruebas

Tres comprobaciones corren en `npm run check` y **no** son pruebas de Vitest,
porque no miran comportamiento sino el propio código:

| Script | Qué sostiene |
|---|---|
| `audit-tokens.mjs` | Ningún color ni medida escritos a mano fuera de los tokens |
| `audit-muertos.mjs` | Ninguna exportación sin consumidor, ni nada que solo use su prueba |
| `audit-pantallas.mjs` | Las **cinco** vistas de lista montan las mismas 10 piezas, ningún paso de recorrido señala un elemento que la vista no pinta, y los tres recorridos cubren lo mismo — *regla 8.16* |

`audit-pantallas` existe porque esto **no lo ve nadie más**: el selector es una
cadena de texto, así que no hay tipo que comprobar. Y es un script y no una
prueba porque compara dos features entre sí: una prueba colocada en `shared`
para poder importar las dos sería una violación de capas — se intentó, y
`eslint-plugin-boundaries` la rechazó, que es exactamente lo que tenía que
pasar.

Los tres se comprobaron **rompiéndolos a propósito** y viéndolos fallar.

---

## 3. Sin cubrir, y por qué

Esta sección **nunca está vacía**. Si lo estuviera, sería que no se miró.

| Qué | Por qué no hay prueba | Riesgo |
|---|---|---|
| **El verbo de actualizar** | Los **siete** controladores del backend declaran `@PutMapping`; la regla del proyecto dice PATCH. Los adaptadores mandan PATCH, así que hoy el servidor real devolvería **405** en toda edición —recetas, productos, usuarios y clientes— | **Alto**: decisión pendiente del dueño del backend; se cambia en una línea por adaptador |
| Cualquier llamada real a Spring | El backend no está levantado en este entorno | **Alto**: el contrato está leído, no ejecutado |
| El alta y la edición **de receta** desde la vista | El asistente con listas repetibles (`useFieldArray`) no se ha recorrido entero en el navegador | Medio: el de producto sí, y comparten `<FormWizard>` |
| Las recetas del mock | **Están inventadas**: el Excel trae inventario, no recetario. Los ids de producto sí son los del Excel | Bajo: es andamio, y está dicho en el archivo |
| Las ventas y los estados de venta del mock | **También inventados**: no hay histórico de caja en el Excel y `estado_venta` no tiene datos de siembra en el SQL | Bajo: es andamio, y está dicho en el archivo |
| El alta y la corrección **de venta** desde la vista | El asistente de dos pasos con líneas repetibles no se ha recorrido entero en el navegador | Medio |
| **Los gráficos del resumen, pintados** | Recharts mide cero en jsdom y no pinta nada. Las **cifras** están probadas en `venta.resumen.test.ts`; que las barras se vean, no | **Medio**: no se ha podido abrir el panel en el navegador — backend caído y sin sesión |
| **El aviso abajo y los puntos del botón, a la vista** | La prueba comprueba `aria-busy` y `disabled`, no dónde sale el aviso ni cómo se ven los puntos | Medio, por lo mismo |
| La preferencia de vista **tras recargar de verdad** | Las pruebas recorren `localStorage` en jsdom; una recarga real del navegador no se ha hecho | Bajo |
| La descarga real del CSV y cómo lo abre Excel | En el navegador del panel no se lanzó ninguna descarga sin permiso, y el archivo no se ha abierto en Excel | Medio: `;` y coma decimal están elegidos para `es-BO`, no comprobados en un Excel |
| **El lint tarda 5 min 30 s** | `import/no-cycle` se lleva el 95 % (medido con `TIMING=1`). Probé `ignoreExternal` y no cambió nada, así que lo revertí | Bajo para el producto, **alto para el flujo**: el `check` completo supera los 10 minutos de una sola orden |
| **Las pruebas de vista bajo carga** | Con el lint corriendo en paralelo, la primera prueba de `producto.view` y de `venta.view` pasó de los 5 s que Vitest da por omisión y falló. Sin carga, 243 de 243 | Medio: el `check` es secuencial y no las solapa, pero una máquina lenta puede tumbarlas. No se ha subido el límite |
| Cómo serializa Spring el `LocalDateTime` | Se **asume** ISO-8601 local (`"2026-09-21T10:15:30"`), que es el valor por omisión de Spring Boot con `jackson-datatype-jsr310`. No hay configuración explícita en `application.yaml` ni servidor donde ejecutarlo | **Alto**: si saliera como array o con zona, `formatearFechaHora` devolvería un guion |
| El booleano `estado` de una línea de venta | Llega en el DTO, no se puede mandar, y **ni el DTO ni el agregado dicen qué significa** | Bajo: se modela y no se construye interfaz encima |
| El acceso con Google | Sin `GOOGLE_CLIENT_ID` no hay `id_token` que mandar | Alto |
| Las dos pantallas en un navegador de verdad | Entrar exige el Spring de `localhost:8081`, que hoy no está levantado; el listado usa mocks, pero el acceso no | **Alto**: el comportamiento está cubierto por §2.5, la **apariencia** de Productos no se ha vuelto a mirar tras los últimos cambios |
| El alta y la edición **desde la vista** (`ProductoForm` dentro de `ProductoView`) | §2.5 cubre leer, cambiar de vista y abrir la ficha; escribir y guardar todavía no | Medio |
| Las columnas que se esconden al estrechar | jsdom no aplica CSS: `hidden md:table-cell` no existe ahí | Medio: se mide en el navegador |
| **Las flechas de la fila de filtros** | Dependen de `scrollWidth` contra `clientWidth`, y en jsdom ambos valen cero: afirmar algo sobre ellas sería medir el simulador | Bajo: **medidas en el navegador** — a 820 px la pista mide 1131 de ancho en 594 visibles, aparece la flecha derecha, al pulsarla avanza a 475 y aparece también la izquierda |
| El `ResizeObserver` que recalcula las flechas | El doble de `vitest.setup.ts` no llama nunca al callback | Bajo: cubierto por la medición de arriba |
| Que el recorrido guiado **se vea bien** | `audit-pantallas` comprueba que el ancla exista, no que Driver.js la resalte donde toca | Medio |
| El arrastre de la hoja en móvil | jsdom no simula un gesto de puntero con inercia | Medio: comprobado midiendo, no arrastrando |
| El defecto del botón que mudaba de `type` | **jsdom no reproduce la *activation behavior* del navegador**: la prueba pasaba y el navegador fallaba | Cubierto de otra forma: se comprueba que no exista ningún `button[type=submit]` |
| Los datos falsos (`personal.mock.ts`) | Es andamio; se borra con el backend | Bajo |
| El BFF (`auth.handlers.ts`) | Necesita un servidor Next en pie | Medio |
| Estilos y disposición | Se comprueban mirando y midiendo, no con pruebas | Bajo |
| **El modelo y su servicio** | Viven en `ml-api/` y se prueban allí: paridad con Python en 440 filas, reglas de dominio y flujo HTTP completo (41 pruebas). Aquí solo se prueba que la pantalla enseña lo que el servicio dice | Bajo: cada lado tiene su red |
| El BFF eligiendo `ml-api` para `evaluacion-lote` y `modelo-riesgo` | Necesita un Next en pie; **se recorrió en el navegador** con el servicio levantado y un token firmado como el de Spring | Medio |
| La fecha de revisión **por omisión** al abrir el formulario de alta | El `DatePicker` no se recorre en jsdom; la prueba usa «revisar de nuevo», que la fija con el reloj | Bajo |
| Las respuestas de `ml-api` copiadas en la prueba de la vista | Son una foto de una ejecución real; si el contrato cambia, el `schema.parse()` del cliente lo caza, la prueba no | Medio |

---

## 4. Cómo se añade una especificación

1. Escribe la promesa **en castellano** y en una frase. Si no sale, la regla
   no está clara todavía.
2. Ponla en la tabla que le toque de este documento.
3. Escribe el `it` con esa misma frase.
4. **Haz que falle primero.** Una prueba que nunca se vio en rojo no prueba
   nada: puede estar comprobando otra cosa, o nada.
5. Si nace de un defecto, cítalo en el comentario del `describe`, como en
   `drawer.test.tsx` y `form-wizard.test.tsx`.
