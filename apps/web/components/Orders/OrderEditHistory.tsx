import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardEdit, ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTime } from "@/app/_utils/formatters";

interface OrderEditHistoryProps {
  orderId: string;
  onChangeNoteSubmit: (note: string) => void;
  previousEdits?: Array<{
    date: string | Date;
    employeeName: string;
    note: string;
  }>;
}

export function OrderEditHistory({ 
  orderId, 
  onChangeNoteSubmit,
  previousEdits = []
}: OrderEditHistoryProps) {
  const [changeNote, setChangeNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (changeNote.trim()) {
      onChangeNoteSubmit(changeNote.trim());
      // Don't clear the note so it will be submitted with the form
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center">
          <ClipboardEdit className="h-4 w-4 mr-2 text-primary" />
          Registrar alteração
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-3">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Textarea
              placeholder="Descreva as alterações realizadas neste pedido..."
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              className="resize-none h-24 text-sm"
            />
            
            {previousEdits.length > 0 && (
              <div className="mt-3">
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center w-full justify-between"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <span>Histórico de alterações ({previousEdits.length})</span>
                  {showHistory ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
                
                {showHistory && (
                  <div className="mt-3 space-y-3 max-h-48 overflow-y-auto pr-1">
                    {previousEdits.map((edit, index) => (
                      <div 
                        key={index} 
                        className="text-xs p-2 border rounded bg-gray-50"
                      >
                        <div className="flex justify-between text-gray-600 mb-1">
                          <span>{edit.employeeName}</span>
                          <span>{formatDateTime(edit.date)}</span>
                        </div>
                        <p className="text-gray-800">{edit.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}