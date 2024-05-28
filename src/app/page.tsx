import Demo from './Demo'

export default function Home() {
  return (
    <div className="px-4">
      <h1 className="text-4xl text-center font-bold leading-loose my-8">
        SSE DEMO
      </h1>
      <div className="w-1/2 mx-auto">
        <Demo url="/api/sse"/>
      </div>
    </div>
  );
}
