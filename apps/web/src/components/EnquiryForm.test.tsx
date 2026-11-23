import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EnquiryForm } from './EnquiryForm';
import { api, ApiError } from '../lib/api-client';
import { renderWithProviders } from '../test-support/render-with-providers';

vi.mock('../lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('../lib/api-client')>('../lib/api-client');
  return { ...actual, api: { submitEnquiry: vi.fn() } };
});

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/name/i), 'Jane');
  await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/message/i), 'Interested in this!');
}

describe('EnquiryForm', () => {
  it('shows a Thank you message after a successful submission', async () => {
    vi.mocked(api.submitEnquiry).mockResolvedValue({ status: 'received' });
    const user = userEvent.setup();

    renderWithProviders(<EnquiryForm productId={1} />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /submit enquiry/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i);
  });

  it('shows inline validation errors and stays on the form after a 400 response', async () => {
    vi.mocked(api.submitEnquiry).mockRejectedValue(new ApiError('Invalid enquiry payload', 400));
    const user = userEvent.setup();

    renderWithProviders(<EnquiryForm productId={1} />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /submit enquiry/i }));

    expect(await screen.findByText('Invalid enquiry payload')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/enquiry form/i)).toBeInTheDocument();
  });

  it('disables the submit button while the request is in flight', async () => {
    let resolveRequest: (() => void) | undefined;
    vi.mocked(api.submitEnquiry).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = () => resolve({ status: 'received' });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<EnquiryForm productId={1} />);
    await fillForm(user);
    const button = screen.getByRole('button', { name: /submit enquiry/i });
    await user.click(button);

    expect(button).toBeDisabled();
    resolveRequest?.();
  });
});
