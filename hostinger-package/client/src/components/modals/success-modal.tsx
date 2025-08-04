import { CheckCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function SuccessModal({ open, onClose, title, message }: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success mb-4">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <Button onClick={onClose} className="bg-primary hover:bg-blue-700">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
