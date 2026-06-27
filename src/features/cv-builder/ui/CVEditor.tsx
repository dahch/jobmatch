import { useState } from "react";
import { Edit3, Save, X, Plus, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "@/shared/ui";
import type { OptimizedCV } from "@/shared/types";

interface CVEditorProps {
  cv: OptimizedCV;
  onSave: (updated: OptimizedCV) => void;
  onCancel: () => void;
}

export function CVEditor({ cv, onSave, onCancel }: CVEditorProps) {
  const [form, setForm] = useState<OptimizedCV>({ ...cv });

  const update = (patch: Partial<OptimizedCV>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-700 flex items-center gap-2">
          <Edit3 size={15} className="text-surface-400" /> Edit CV
        </h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(form)}>
            <Save size={13} className="mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X size={13} className="mr-1" /> Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={form.full_name} onChange={(e) => update({ full_name: e.target.value })} />
        <Input label="Email" value={form.contact.email || ""} onChange={(e) => update({ contact: { ...form.contact, email: e.target.value } })} />
        <Input label="Phone" value={form.contact.phone || ""} onChange={(e) => update({ contact: { ...form.contact, phone: e.target.value } })} />
        <Input label="Location" value={form.contact.location || ""} onChange={(e) => update({ contact: { ...form.contact, location: e.target.value } })} />
        <Input label="LinkedIn" value={form.contact.linkedin || ""} onChange={(e) => update({ contact: { ...form.contact, linkedin: e.target.value } })} />
        <Input label="GitHub" value={form.contact.github || ""} onChange={(e) => update({ contact: { ...form.contact, github: e.target.value } })} />
      </div>

      <Textarea label="Summary" value={form.summary} rows={3} onChange={(e) => update({ summary: e.target.value })} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] font-medium text-surface-600">Work Experience</label>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              update({
                work_experience: [
                  ...form.work_experience,
                  { company: "", title: "", start_date: "", description: "", technologies: [], achievements: [] },
                ],
              })
            }
          >
            <Plus size={12} className="mr-1" /> Add
          </Button>
        </div>
        {form.work_experience.map((exp, i) => (
          <div key={i} className="border border-surface-200 rounded-lg p-3 mb-2 space-y-2 bg-surface-50/30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-surface-400 uppercase tracking-wide">Position {i + 1}</span>
              <button
                onClick={() =>
                  update({
                    work_experience: form.work_experience.filter((_, j) => j !== i),
                  })
                }
                className="text-red-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Title" value={exp.title} onChange={(e) => {
                const updated = [...form.work_experience];
                updated[i] = { ...updated[i], title: e.target.value };
                update({ work_experience: updated });
              }} />
              <Input placeholder="Company" value={exp.company} onChange={(e) => {
                const updated = [...form.work_experience];
                updated[i] = { ...updated[i], company: e.target.value };
                update({ work_experience: updated });
              }} />
              <Input placeholder="Start date" value={exp.start_date} onChange={(e) => {
                const updated = [...form.work_experience];
                updated[i] = { ...updated[i], start_date: e.target.value };
                update({ work_experience: updated });
              }} />
              <Input placeholder="End date" value={exp.end_date || ""} onChange={(e) => {
                const updated = [...form.work_experience];
                updated[i] = { ...updated[i], end_date: e.target.value || undefined };
                update({ work_experience: updated });
              }} />
            </div>
            <Textarea
              placeholder="Description"
              rows={2}
              value={exp.description}
              onChange={(e) => {
                const updated = [...form.work_experience];
                updated[i] = { ...updated[i], description: e.target.value };
                update({ work_experience: updated });
              }}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-[13px] font-medium text-surface-600 block mb-2">Skills</label>
        {form.skills.map((cat, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <Input
              placeholder="Category"
              value={cat.category}
              className="w-40"
              onChange={(e) => {
                const updated = [...form.skills];
                updated[i] = { ...updated[i], category: e.target.value };
                update({ skills: updated });
              }}
            />
            <Input
              placeholder="Items (comma separated)"
              value={cat.items.join(", ")}
              onChange={(e) => {
                const updated = [...form.skills];
                updated[i] = { ...updated[i], items: e.target.value.split(",").map((s) => s.trim()) };
                update({ skills: updated });
              }}
            />
            <button onClick={() => update({ skills: form.skills.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => update({ skills: [...form.skills, { category: "", items: [] }] })}
        >
          <Plus size={12} className="mr-1" /> Add skill category
        </Button>
      </div>
    </div>
  );
}
