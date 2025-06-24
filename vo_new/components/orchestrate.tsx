import { MainLayout } from "@/components/main-layout"

export default function Orchestrate() {
  return (
    <MainLayout>
        <div 
          style={{ 
            height: '100vh',
            width: '100%',
            margin: 0,
            padding: 0
          }}
        >
            <iframe 
              src="http://localhost:3000/pipeline/orchestrate?hide=true" 
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                margin: 0,
                padding: 0,
                display: 'block'
              }}
            />
        </div>
    </MainLayout>
  )
}
