import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Pencil + delete pair shown below every profile while editing, on profile selection and the Profile page. */
export default function ProfileEditActions({ name, onEdit, onDelete, canDelete }: { name: string; onEdit: () => void; onDelete: () => void; canDelete: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="novaPlayer" size="icon" onClick={onEdit} aria-label={`Edit ${name}`} title="Edit" className="h-8 w-8 border border-nova-line [&_svg]:size-4">
        <Pencil />
      </Button>
      <Button type="button" variant="novaPlayer" size="icon" onClick={onDelete} disabled={!canDelete} aria-label={`Delete ${name}`} title="Delete" className="h-8 w-8 border border-nova-line hover:text-nova-accent disabled:opacity-30 [&_svg]:size-4">
        <Trash2 />
      </Button>
    </div>
  );
}
