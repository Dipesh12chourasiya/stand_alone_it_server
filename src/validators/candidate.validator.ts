import { z } from 'zod/v4';

// Token param validation
export const tokenParamSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

// Device verification submission
export const deviceVerificationSchema = z.object({
  cameraPermission: z.boolean(),
  microphonePermission: z.boolean(),
  browser: z.string().min(1, 'Browser is required').max(200),
  operatingSystem: z.string().min(1, 'Operating system is required').max(200),
  internetStatus: z.boolean(),
  cameraAvailable: z.boolean(),
  microphoneAvailable: z.boolean(),
  screenResolution: z.string().min(1, 'Screen resolution is required').max(50),
  timezone: z.string().min(1, 'Timezone is required').max(100),
});

export type TokenParam = z.infer<typeof tokenParamSchema>;
export type DeviceVerificationInput = z.infer<typeof deviceVerificationSchema>;
