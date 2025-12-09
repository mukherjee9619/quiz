import React, { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import { getJSON, del, uploadJSONFile } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Questions() {
  const [list, setList] = useState([])
  const [file, setFile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getJSON('/api/admin/questions').then(res => { if (Array.isArray(res)) setList(res) })
  }, [])
  console.log("list", list);

  const remove = async (id) => {
    if (!confirm('Delete question?')) return
    await del(`/api/admin/questions/${id}`)
    setList(prev => prev.filter(q => q._id !== id))
  }

  const upload = async () => {
    if (!file) return alert('Select JSON file')
    const res = await uploadJSONFile('/api/admin/questions/import', file)
    if (res?.ok) {
      alert(`Imported ${res.inserted || 0} questions`)
      const newList = await getJSON('/api/admin/questions')
      setList(newList)
    } else {
      alert(res?.message || 'Import failed')
    }
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Topbar title="Questions" />
        <div className="content">
          <div className="card-admin">
            <div className="d-flex justify-content-between align-items-center">
              <h5>Questions</h5>
              <div>
                <button className="btn btn-primary me-2" onClick={() => navigate('/questions/add')}>Add Question</button>
                <input type="file" accept=".json" onChange={e => setFile(e.target.files[0])} />
                <button className="btn btn-outline-secondary ms-2" onClick={upload}>Upload JSON</button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {list.map(q => (
                <div key={q._id} className="list-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{q.question}</div>
                    <div className="muted">Subject: {q.subjectName}</div>
                  </div>

                  <div>
                    <button onClick={() => navigate(`/questions/edit/${q._id}`)} className="btn btn-outline-secondary btn-sm me-2">
                      Edit
                    </button>
                    <button onClick={() => remove(q._id)} className="btn btn-danger btn-sm">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
