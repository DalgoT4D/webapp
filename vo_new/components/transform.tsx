import { MainLayout } from "@/components/main-layout"

export default function Transform() {
  return (
    <MainLayout>
        <div 
          style={{ 
            height: '100vh',
            width: '100%',
            margin: 0,
            padding: 0,
            border: "2px solid red"
          }}
        >
            <iframe 
              src="http://localhost:3000/pipeline/transform?hide=true" 
              style={{
                width: '100%',
                height: '100%',
             
                margin: 0,
                padding: 0,
                display: 'block',
                border: "2px solid blue"
              }}
            />
        </div>
    </MainLayout>
  )
}
