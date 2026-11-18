import { BrowserRouter, Routes, Route, Outlet, Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Minus, Trash2 } from "lucide-react"
import { useState, createContext, useContext, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

// Types
interface Todo {
  id: string
  text: string
  completed: boolean
}

// Counter Context (using Context for state as per preferences)
interface CounterContextType {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const CounterContext = createContext<CounterContextType | undefined>(undefined)

export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  
  return (
    <CounterContext.Provider
      value={{
        count,
        increment: () => setCount(c => c + 1),
        decrement: () => setCount(c => c - 1),
        reset: () => setCount(0),
      }}
    >
      {children}
    </CounterContext.Provider>
  )
}

function useCounter() {
  const context = useContext(CounterContext)
  if (!context) throw new Error("useCounter must be used within CounterProvider")
  return context
}

// Todo Context
interface TodoContextType {
  todos: Todo[]
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
}

const TodoContext = createContext<TodoContextType | undefined>(undefined)

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Learn React Router declarative mode", completed: true },
    { id: "2", text: "Set up Tailwind + Shadcn", completed: true },
    { id: "3", text: "Deploy to Cloudflare Pages", completed: false },
  ])

  const addTodo = (text: string) => {
    setTodos(prev => [...prev, { id: crypto.randomUUID(), text, completed: false }])
  }

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <TodoContext.Provider value={{ todos, addTodo, toggleTodo, deleteTodo }}>
      {children}
    </TodoContext.Provider>
  )
}

function useTodos() {
  const context = useContext(TodoContext)
  if (!context) throw new Error("useTodos must be used within TodoProvider")
  return context
}

// Components
function Counter() {
  const { count, increment, decrement, reset } = useCounter()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Counter (Context State)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <Button variant="outline" size="icon" onClick={decrement} aria-label="Decrement">
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-4xl font-mono tabular-nums w-20 text-center">{count}</span>
          <Button variant="outline" size="icon" onClick={increment} aria-label="Increment">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="secondary" onClick={reset} className="w-full">
          Reset
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          State managed via React Context (no external libraries)
        </p>
      </CardContent>
    </Card>
  )
}

// Todo Form with React Hook Form + Zod
const todoSchema = z.object({
  text: z.string().min(1, "Todo cannot be empty").max(200, "Todo too long"),
})

type TodoFormData = z.infer<typeof todoSchema>

function TodoForm() {
  const { addTodo } = useTodos()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
  })

  return (
    <form onSubmit={handleSubmit((data) => { addTodo(data.text); reset() })} className="space-y-2">
      <div className="flex gap-2">
        <Input
          {...register("text")}
          placeholder="Add a new todo..."
          className="flex-1"
          aria-invalid={!!errors.text}
        />
        <Button type="submit" size="icon" aria-label="Add todo">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {errors.text && (
        <p className="text-sm text-destructive">{errors.text.message}</p>
      )}
    </form>
  )
}

function TodoItem({ todo }: { todo: Todo }) {
  const { toggleTodo, deleteTodo } = useTodos()
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        className="h-4 w-4 rounded border-input"
      />
      <span className={cn(
        "flex-1 text-left",
        todo.completed && "line-through text-muted-foreground"
      )}>
        {todo.text}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => deleteTodo(todo.id)}
        aria-label="Delete todo"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function TodoList() {
  const { todos } = useTodos()
  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todos (Context + RHF + Zod)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TodoForm />
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No todos yet</p>
          ) : (
            todos.map(todo => <TodoItem key={todo.id} todo={todo} />)
          )}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground border-t pt-3">
          <span>{activeCount} active</span>
          <span>{completedCount} completed</span>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Forms: React Hook Form + Zod + Shadcn components
        </p>
      </CardContent>
    </Card>
  )
}

// Query params demo
function QueryParamsDemo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get("view") || "grid"
  const filter = searchParams.get("filter") || "all"

  const updateView = (newView: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("view", newView)
    setSearchParams(params)
  }

  const updateFilter = (newFilter: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("filter", newFilter)
    setSearchParams(params)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Params State</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            onClick={() => updateView("grid")}
          >
            Grid
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => updateView("list")}
          >
            List
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => updateFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            onClick={() => updateFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => updateFilter("completed")}
          >
            Completed
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Current URL params: <code>?view={view}&filter={filter}</code></p>
          <p>State persisted in URL, shareable & bookmarkable</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Pages
function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">VitePlus Demo</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          React Router declarative mode • Tailwind + Shadcn • Context state • React Hook Form + Zod
        </p>
      </header>

      <nav className="flex justify-center gap-4" aria-label="Demo navigation">
        <Link to="/counter">
          <Button>Counter Demo</Button>
        </Link>
        <Link to="/todos">
          <Button>Todos Demo</Button>
        </Link>
        <Link to="/query-params">
          <Button>Query Params Demo</Button>
        </Link>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Counter />
        <TodoList />
        <QueryParamsDemo />
      </div>

      <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
        <p>Deployed to Cloudflare Pages • SPA • No SSR</p>
      </footer>
    </div>
  )
}

function CounterPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-6">
        ← Back to Home
      </Link>
      <Counter />
    </div>
  )
}

function TodosPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-6">
        ← Back to Home
      </Link>
      <TodoList />
    </div>
  )
}

function QueryParamsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-6">
        ← Back to Home
      </Link>
      <QueryParamsDemo />
    </div>
  )
}

// Layout with providers
function AppLayout() {
  return (
    <CounterProvider>
      <TodoProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      </TodoProvider>
    </CounterProvider>
  )
}

// Main App with React Router Declarative Mode
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="counter" element={<CounterPage />} />
          <Route path="todos" element={<TodosPage />} />
          <Route path="query-params" element={<QueryParamsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

// Helper for className merging (already in utils but adding here for completeness)
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}