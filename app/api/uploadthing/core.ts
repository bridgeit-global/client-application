import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

const auth = () => ({ id: 'fakeId' }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  receiptUploader: f({
    pdf: { maxFileSize: '4MB' },
    image: { maxFileSize: '4MB' }
  })
    .middleware(async () => {
      return { timestamp: Date.now() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.timestamp, fileUrl: file.url };
    }),
  multiFormatUploader: f({
    // Define accepted file types
    'application/pdf': { maxFileSize: '2MB', maxFileCount: 50 },
    'text/html': { maxFileSize: '1MB', maxFileCount: 50 }
  })
    .middleware(async () => {
      // Authorization check
      const user = await auth();
      if (!user) throw new Error('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  excelUploader: f({
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      maxFileSize: '4MB'
    }
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const user = auth();

      // If you throw, the user will not be able to upload
      if (!user) throw new Error('Unauthorized');

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId };
    }),
  pdfUploader: f({
    'application/pdf': {
      maxFileSize: '8MB',
      maxFileCount: 50
    }
  })
    .middleware(async () => {
      const user = await auth();
      if (!user) throw new Error('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
  htmlUploader: f({
    'text/html': {
      maxFileSize: '1MB', // Restrict to 1MB or adjust as needed
      maxFileCount: 1
    }
  })
    .middleware(async () => {
      const user = await auth();
      if (!user) throw new Error('Unauthorized');
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
