import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, FileText } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">Support Center</h1>
          <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
            Get help with your FlowRamp transactions
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>Send us a message and we'll get back to you soon</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="Transaction issue" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionId">Session/Request ID (Optional)</Label>
                  <Input id="sessionId" placeholder="sess_abc123 or off_345" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Describe your issue..." rows={5} required />
                </div>

                <Button type="submit" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Common Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Transaction stuck in processing</p>
                    <p className="text-sm text-muted-foreground">What to do if your transaction is pending</p>
                  </div>
                </Link>

                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Payment completed but no tokens</p>
                    <p className="text-sm text-muted-foreground">Troubleshooting on-ramp issues</p>
                  </div>
                </Link>

                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Deposit not detected</p>
                    <p className="text-sm text-muted-foreground">Off-ramp deposit troubleshooting</p>
                  </div>
                </Link>

                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Wrong wallet address</p>
                    <p className="text-sm text-muted-foreground">How to update or cancel a transaction</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">How to buy stablecoins</p>
                    <p className="text-sm text-muted-foreground">Step-by-step on-ramp guide</p>
                  </div>
                </Link>

                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">How to sell stablecoins</p>
                    <p className="text-sm text-muted-foreground">Step-by-step off-ramp guide</p>
                  </div>
                </Link>

                <Link href="#" className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fees and limits</p>
                    <p className="text-sm text-muted-foreground">Understanding transaction costs</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
