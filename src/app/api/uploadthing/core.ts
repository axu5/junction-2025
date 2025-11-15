import { auth } from "@/lib/auth";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  saunaImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      return { userId: session?.user.id ?? null };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log("Sauna image uploaded:", {
        url: file.ufsUrl,
        userId: metadata.userId,
      });

      return { url: file.ufsUrl };
    }),
  experienceImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      return { userId: session?.user.id ?? null };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log("Experience image uploaded:", {
        url: file.ufsUrl,
        userId: metadata.userId,
      });

      // you could create an experienceImagesTable row here if you wanted
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
