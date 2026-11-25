import { Appointments } from "@/components/appointments/Appointments"

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-lg font-medium">Meus agendamentos</h1>
      <Appointments />
    </main>
  )
}
