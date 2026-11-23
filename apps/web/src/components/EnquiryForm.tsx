import { useState, type FormEvent } from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { ApiError } from '../lib/api-client';
import { useSubmitEnquiryMutation } from '../queries/enquiry.mutations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface EnquiryFormProps {
  productId: number;
}

export function EnquiryForm({ productId }: EnquiryFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const mutation = useSubmitEnquiryMutation();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(
      { productId, name, email, message },
      {
        onSuccess: () => toast.success('Enquiry sent - we will be in touch soon'),
      },
    );
  }

  if (mutation.isSuccess) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-5"
      >
        <CheckCircle2Icon className="mt-0.5 size-6 shrink-0 text-success" />
        <div>
          <h3 className="font-semibold">Thank you</h3>
          <p className="text-sm text-muted-foreground">
            We received your enquiry and will be in touch soon.
          </p>
        </div>
      </div>
    );
  }

  const errorMessage = mutation.isError
    ? mutation.error instanceof ApiError
      ? mutation.error.message
      : 'Something went wrong. Please try again.'
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Enquiry form"
      className="flex flex-col gap-4 rounded-lg border bg-card p-5 shadow-sm"
    >
      <div>
        <h3 className="font-semibold">Send us an enquiry</h3>
        <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-name">Name</Label>
        <Input
          id="enquiry-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-email">Email</Label>
        <Input
          id="enquiry-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea
          id="enquiry-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-1">
        {mutation.isPending ? 'Sending...' : 'Submit enquiry'}
      </Button>
    </form>
  );
}
