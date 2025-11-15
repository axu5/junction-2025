import { PropsWithChildren } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { GoogleLoginButton } from "./login-with-google";
import { Button } from "./ui/button";

export function LoginRequiredDrawer({ children }: PropsWithChildren) {
  return (
    <Drawer>
      <DrawerTrigger>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Login</DrawerTitle>
        </DrawerHeader>
        <DrawerDescription className='w-[80%] mx-auto'>
          <GoogleLoginButton />
        </DrawerDescription>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant='outline'>Stay logged out</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
