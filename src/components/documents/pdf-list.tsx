import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { FileText, Download } from "lucide-react"

interface PdfListProps {
    title: string;
    items: any[];
    type: 'report' | 'survey' | 'quote';
}

export function PdfList({ title, items, type }: PdfListProps) {
    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>

            <div className="rounded-md border border-slate-700 bg-slate-900">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-700 hover:bg-slate-800">
                            <TableHead className="text-slate-400">Folio</TableHead>
                            <TableHead className="text-slate-400">Proyecto / Cliente</TableHead>
                            <TableHead className="text-slate-400">Fecha</TableHead>
                            <TableHead className="text-right text-slate-400">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id} className="border-slate-700 hover:bg-slate-800 text-slate-200">
                                <TableCell className="font-medium">{item.folio}</TableCell>
                                <TableCell>
                                    {item.proyectos?.nombre || item.cliente_prospecto || item.cliente || "N/A"}
                                </TableCell>
                                <TableCell>{new Date(item.fecha_reporte || item.fecha_visita || item.fecha_emision).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">
                                    {item.pdf_final_url || item.pdf_url ? (
                                        <Button variant="outline" size="sm" className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-white" asChild>
                                            <a href={item.pdf_final_url || item.pdf_url} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4" />
                                                Ver PDF
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-slate-500 text-xs">No disponible</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-slate-400">No hay documentos disponibles.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
