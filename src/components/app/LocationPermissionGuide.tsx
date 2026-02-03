import { useState } from "react";
import { HelpCircle, MapPin, Settings, Smartphone, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const LocationPermissionGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Location Help</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] sm:h-[70vh]">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Enable Accurate Location Tracking
          </SheetTitle>
          <SheetDescription>
            For the best walk tracking experience, enable "Always Allow" location permissions.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-80px)] pr-4">
          <Tabs defaultValue="ios" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="ios" className="gap-1.5">
                <Smartphone className="h-4 w-4" />
                iOS
              </TabsTrigger>
              <TabsTrigger value="android" className="gap-1.5">
                <Smartphone className="h-4 w-4" />
                Android
              </TabsTrigger>
              <TabsTrigger value="desktop" className="gap-1.5">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Safari / Chrome on iPhone
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">1</span>
                    <span>Open <strong className="text-foreground">Settings</strong> app on your iPhone</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">2</span>
                    <span>Scroll down and tap <strong className="text-foreground">Privacy & Security</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">3</span>
                    <span>Tap <strong className="text-foreground">Location Services</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">4</span>
                    <span>Find and tap <strong className="text-foreground">Safari</strong> (or Chrome)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">5</span>
                    <span>Select <strong className="text-foreground">"While Using the App"</strong> or <strong className="text-foreground">"Always"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">6</span>
                    <span>Toggle on <strong className="text-foreground">"Precise Location"</strong> for best accuracy</span>
                  </li>
                </ol>
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <h4 className="font-medium text-warning-foreground mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Important Tip
                </h4>
                <p className="text-sm text-muted-foreground">
                  Keep the browser tab open and visible during your walk. iOS may pause GPS tracking if the app is in the background for too long.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="android" className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Chrome on Android
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">1</span>
                    <span>Open <strong className="text-foreground">Settings</strong> app on your Android device</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">2</span>
                    <span>Tap <strong className="text-foreground">Apps</strong> (or "Apps & notifications")</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">3</span>
                    <span>Find and tap <strong className="text-foreground">Chrome</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">4</span>
                    <span>Tap <strong className="text-foreground">Permissions</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">5</span>
                    <span>Tap <strong className="text-foreground">Location</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">6</span>
                    <span>Select <strong className="text-foreground">"Allow all the time"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">7</span>
                    <span>Toggle on <strong className="text-foreground">"Use precise location"</strong></span>
                  </li>
                </ol>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <h4 className="font-medium mb-2">Disable Battery Optimization</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  For uninterrupted tracking, prevent Android from sleeping the browser:
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">1</span>
                    <span>Settings → Battery → Battery Optimization</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">2</span>
                    <span>Find Chrome → Select "Don't optimize"</span>
                  </li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="desktop" className="space-y-4">
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Chrome / Edge / Firefox
                </h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">1</span>
                    <span>Click the <strong className="text-foreground">lock icon</strong> in the address bar</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">2</span>
                    <span>Click <strong className="text-foreground">Site settings</strong> or <strong className="text-foreground">Permissions</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">3</span>
                    <span>Find <strong className="text-foreground">Location</strong> and set to <strong className="text-foreground">"Allow"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">4</span>
                    <span>Refresh the page to apply changes</span>
                  </li>
                </ol>
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                <h4 className="font-medium mb-2">Note</h4>
                <p className="text-sm text-muted-foreground">
                  Desktop browsers use Wi-Fi and IP-based location which is less accurate than mobile GPS. For the best tracking experience, use a phone or tablet.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Best Practices for Accurate Tracking
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Keep the app visible and screen on during walks</li>
              <li>• Start recording outdoors with a clear view of the sky</li>
              <li>• Wait for GPS to lock on before starting your walk</li>
              <li>• Avoid areas with tall buildings that block satellite signals</li>
              <li>• For best results, install the app as a PWA (Add to Home Screen)</li>
            </ul>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default LocationPermissionGuide;
