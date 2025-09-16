export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Shield, Database, Globe } from "lucide-react"

export default async function AdminSettings() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your admin account and system settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your admin account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Account Status</p>
              <Badge variant="secondary" className="mt-1">
                Active
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Last Sign In</p>
              <p className="text-sm text-muted-foreground">
                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}
              </p>
            </div>
            <Button variant="outline" className="w-full bg-transparent">
              Update Profile
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage security and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Last updated: Recently</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
              <Badge variant="outline" className="mt-1">
                Not Enabled
              </Badge>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent">
                Change Password
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>Platform configuration and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Database Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Connected</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Environment</p>
              <Badge variant="secondary" className="mt-1">
                Development
              </Badge>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full bg-transparent">
                <Database className="mr-2 h-4 w-4" />
                Database Settings
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                <Globe className="mr-2 h-4 w-4" />
                Site Configuration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Platform Version</p>
              <p className="text-sm text-muted-foreground">v1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Last Backup</p>
              <p className="text-sm text-muted-foreground">Today, 3:00 AM</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Uptime</p>
              <p className="text-sm text-muted-foreground">99.9%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Support</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
