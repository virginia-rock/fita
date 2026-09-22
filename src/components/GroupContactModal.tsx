import { useRef, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildContactMailto,
  validateContactForm,
  type ContactFormData,
  type ContactFormErrors,
} from "@/lib/contact";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_FORM: ContactFormData = {
  name: "",
  email: "",
  company: "",
  whatsapp: "",
  description: "",
};

type GroupContactModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GroupContactModal({ open, onOpenChange }: GroupContactModalProps) {
  const [form, setForm] = useState<ContactFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const firstInvalidRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const updateField = (field: keyof ContactFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateContactForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => firstInvalidRef.current?.focus());
      return;
    }

    setSubmitted(true);
    window.location.href = buildContactMailto(form);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitted(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-paper text-ink sm:max-w-xl">
        <DialogHeader className="pr-8 text-left">
          <div className="label-caps text-clay">Contratação em grupo</div>
          <DialogTitle className="mt-2 text-2xl font-medium tracking-tight">
            Vamos conversar sobre o seu grupo.
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-ink/60">
            Conte um pouco sobre o que você precisa. Ao enviar, abriremos seu cliente de e-mail com a mensagem pronta para carlospessin@gmail.com.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="mt-4 rounded-sm bg-sage/10 p-5 text-sm leading-relaxed text-ink/75" role="status">
            Seu cliente de e-mail foi aberto com os dados preenchidos. É só revisar e enviar a mensagem.
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="mt-5 block rounded-sm bg-clay px-4 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form className="mt-2 space-y-4" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ContactField
                ref={firstInvalidRef}
                id="group-contact-name"
                label="Nome"
                value={form.name}
                error={errors.name}
                required
                autoComplete="name"
                onChange={(value) => updateField("name", value)}
              />
              <ContactField
                id="group-contact-email"
                label="E-mail"
                type="email"
                value={form.email}
                error={errors.email}
                required
                autoComplete="email"
                onChange={(value) => updateField("email", value)}
              />
              <ContactField
                id="group-contact-company"
                label="Empresa"
                value={form.company}
                autoComplete="organization"
                onChange={(value) => updateField("company", value)}
              />
              <ContactField
                id="group-contact-whatsapp"
                label="WhatsApp"
                type="tel"
                value={form.whatsapp}
                autoComplete="tel"
                onChange={(value) => updateField("whatsapp", value)}
              />
            </div>
            <ContactField
              id="group-contact-description"
              label="Descrição"
              value={form.description}
              error={errors.description}
              required
              multiline
              onChange={(value) => updateField("description", value)}
            />
            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-[11px] text-ink/45">* campos obrigatórios</p>
              <button
                type="submit"
                className="rounded-sm bg-clay px-5 py-3 text-xs font-medium uppercase tracking-widest text-paper transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
              >
                Enviar contato
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ContactFieldProps = {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

function ContactField({
  id,
  label,
  value,
  error,
  required,
  type = "text",
  autoComplete,
  multiline = false,
  onChange,
  ...props
}: ContactFieldProps & { ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement> }) {
  const describedBy = error ? `${id}-error` : undefined;
  const sharedProps = {
    id,
    value,
    required,
    autoComplete,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    className: `mt-1.5 w-full resize-none rounded-sm bg-vellum/60 px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-inset transition focus:ring-2 focus:ring-clay ${error ? "ring-down" : "ring-ink/10"}`,
    ...props,
  };

  return (
    <div>
      <label htmlFor={id} className="label-caps text-ink/55">
        {label} {required && <span className="text-clay">*</span>}
      </label>
      {multiline ? (
        <Textarea {...sharedProps} className={`${sharedProps.className} resize-none`} rows={4} />
      ) : (
        <input {...sharedProps} type={type} />
      )}
      {error && (
        <p id={describedBy} className="mt-1 text-xs text-down" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
