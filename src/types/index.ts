export type Project = {
    id: string; // or number, depending on DB settings, usually UUID in Supabase is string
    nombre: string;
    cliente: string;
    solicitante: string;
    ubicacion: string;
    fecha_inicio: string;
    fecha_fin: string | null;
    status: string;
    consecutivo_folio: number;
};

export type Task = {
    id: number;
    titulo: string;
    descripcion: string | null;
    fecha_vencimiento: string | null;
    estatus: string | null; // "Pendiente" | "Completada" | "En Proceso" etc
    created_at: string;
    proyecto_id: number | null;
    prioridad: string | null;
    asignado_a: string | null;
    responsable: string | null; // Profile ID (UUID)
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    fecha_inicio_real?: string | null;
    fecha_fin_real?: string | null;
    observaciones?: string | null;
    proyectos?: {
        nombre: string;
    } | null;
};

export type Expense = {
    id: number;
    fecha: string;
    concepto: string;
    monto: number;
    categoria: string | null;
    metodo_pago: string | null;
    ticket_url: string | null;
    usuario_id?: string | null; // Added
    proyecto_id: number | null;
    proyectos?: {
        nombre: string;
        cliente?: string;
        ubicacion?: string;
    } | null;
};

export type Incident = {
    id: number;
    titulo: string;
    descripcion: string | null;
    severidad: "Baja" | "Media" | "Alta" | "Crítica";
    estatus: "Abierta" | "En Revisión" | "Resuelta";
    fecha_inicio: string;
    impacto_costo: number | null;
    impacto_tiempo: string | null;
    evidencia_fotos: string[] | string | null;
    proyecto_id: number | null;
    tarea_id: number | null;
    solucion_final?: string | null; // Added
    fecha_cierre?: string | null; // Added
    proyectos?: {
        nombre: string;
        cliente?: string;
        ubicacion?: string;
    } | null;
    tareas?: {
        titulo: string;
    } | null;
    incidencia_tareas?: {
        tarea_id: number;
        tareas: {
            titulo: string;
        };
    }[];
};

export type Survey = {
    id: number;
    folio: string;
    cliente_prospecto: string | null;
    tipo_servicio: string | null;
    estatus: string | null;
    fecha_visita: string | null;
    ubicacion: string | null; // Added based on context
    proyecto_id: number | null;
    pdf_final_url: string | null;
    detalles_tecnicos?: string | null; // Added
    requerimientos?: string | null; // Added
    medidas_aprox?: string | null; // Added
    tecnicos?: string | null; // Added
    evidencia_fotos?: string[] | string | null; // Added
    created_at?: string; // Added
    proyectos?: {
        nombre: string;
        cliente?: string;
        ubicacion?: string;
    } | null;
};

export type Quote = {
    id: number;
    folio: string;
    cliente: string;
    descripcion: string | null; // Sometimes just description
    total: number;
    estatus: "Borrador" | "Enviada" | "Aprobada" | "Rechazada";
    fecha_envio: string | null;
    vigencia: string | null;
    pdf_url: string | null;
    proyecto_id: number | null;
    subtotal: number;
    iva: number;
    fecha_emision?: string | null; // Added
    ubicacion?: string | null; // Added
    items_json?: any; // Added, could be JSON
    solicitante?: string | null; // Added
    requiere_factura?: boolean | null; // Added
    proyectos?: {
        nombre: string;
        ubicacion?: string;
        solicitante?: string;
    } | null;
};

export type Report = {
    id: number;
    resumen_titulo: string;
    folio: string | null;
    tipo: string | null;
    fecha_reporte: string | null;
    pdf_final_url: string | null;
    fotos_url: string[] | string | null;
    proyecto_id: number | null;
    actividades?: string | null;
    materiales?: string | null; // Added
    observaciones?: string | null; // Added
    solicitante?: string | null; // Added
    duracion?: string | null; // Added
    generado_por?: string | null;
    ubicacion?: string | null; // Added
    proyectos?: {
        nombre: string;
        cliente?: string;
        ubicacion?: string;
    } | null;
};

export type Profile = {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: "admin" | "engineer" | "user" | "viewer" | string | null;
    status: "active" | "inactive" | "invited" | string | null;
    created_at?: string;
    updated_at?: string;
};

export type Minuta = {
    id: number;
    proyecto_id: number | null;
    fecha: string;
    titulo: string;
    participantes: string | null;
    puntos_tratados: string | null;
    acuerdos: string | null;
    pendientes: string | null;
    siguiente_reunion?: string | null;
    created_at?: string;
    user_id?: string;
    proyectos?: {
        nombre: string;
    } | null;
};

export type ClientMeeting = {
    id: number;
    proyecto_id: number | null;
    fecha: string;
    titulo: string;
    participantes: string | null;
    puntos_tratados: string | null;
    acuerdos: string | null;
    pendientes: string | null;
    siguiente_reunion?: string | null;
    created_at?: string;
    user_id?: string;
    proyectos?: {
        nombre: string;
    } | null;
};

export type Nota = {
    id: string;
    proyecto_id: number | null;
    tarea_id: number | null;
    fecha: string;
    titulo: string;
    contenido: string | null;
    autor: string | null;
    url_imagenes: string[] | null; // JSONB array of strings
    ultima_actualizacion: string;
    autor_ultima_actualizacion: string | null;
    proyectos?: {
        nombre: string;
    } | null;
    tareas?: {
        titulo: string;
    } | null;
};

export type Budget = {
    id: number;
    proyecto_id: number;
    version: number;
    nombre: string;
    estatus: "Borrador" | "Enviado" | "Aprobado" | "Rechazado";
    honorarios_porcentaje: number;
    honorarios_monto_fijo: number;
    tipo_honorarios: "Porcentaje" | "Fijo" | "Mixto";
    indirectos_porcentaje: number;
    iva_porcentaje: number;
    total_costo_directo: number;
    total_venta_directa: number;
    total_final: number;
    created_at?: string;
    updated_at?: string;
    categorias?: BudgetCategory[];
};

export type BudgetCategory = {
    id: number;
    presupuesto_id: number;
    nombre: string;
    orden: number;
    created_at?: string;
    items?: BudgetItem[];
};

export type BudgetItem = {
    id: number;
    categoria_id: number;
    concepto: string;
    unidad: string | null;
    cantidad: number;
    costo_unitario: number;
    prec_venta_unitario: number;
    orden: number;
    created_at?: string;
};
