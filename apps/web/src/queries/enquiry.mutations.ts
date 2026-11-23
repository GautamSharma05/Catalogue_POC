import { useMutation } from '@tanstack/react-query';

import { api } from '../lib/api-client';
import type { EnquiryInput } from '../lib/types';

export function useSubmitEnquiryMutation() {
  return useMutation({
    mutationFn: (input: EnquiryInput) => api.submitEnquiry(input),
  });
}
