import React, { useEffect, useState } from 'react'
import { collection, doc, getDocs, query, orderBy, setDoc, updateDoc, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../../lib/firebase'
function Admin() {
  const [authorized, setAuthorized] = useState(() => sessionStorage.getItem('admin_ok') === '1')
  const [keyInput, setKeyInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState('')
  const [list, setList] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editImagesData, setEditImagesData] = useState([])
  const [orders, setOrders] = useState([])

  const adminKey = import.meta.env.VITE_ADMIN_KEY || 'admin123'

  const handleLogin = (e) => {
    e.preventDefault()
    if (keyInput === adminKey) {
      sessionStorage.setItem('admin_ok', '1')
      setAuthorized(true)
    } else {
      setLog('Invalid key')
    }
  }

  async function loadProducts() {
    const q = query(collection(db, 'products'), orderBy('name'))
    const snap = await getDocs(q)
    setList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  async function toggleActive(id, current) {
    await updateDoc(doc(collection(db, 'products'), id), { active: !current })
    setList(prev => prev.map(p => p.id === id ? { ...p, active: !current } : p))
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleEditFiles(p, e) {
    const files = Array.from(e.target.files || [])
    const accepted = []
    for (const f of files) {
      if (f.size > 1024 * 1024) { // 1MB cap
        setLog(prev => (prev ? prev + ' ' : '') + `${f.name} >1MB skipped`)
        continue
      }
      try {
        const dataUrl = await fileToDataUrl(f)
        accepted.push(dataUrl)
      } catch {}
    }
    setEditImagesData(prev => [...prev, ...accepted])
  }

  async function saveNewImages(p) {
    if (editImagesData.length === 0) return
    const images = [ ...(p.images || []), ...editImagesData ]
    await updateDoc(doc(collection(db, 'products'), p.id), { images })
    setList(prev => prev.map(x => x.id===p.id ? { ...x, images } : x))
    setEditImagesData([])
    setEditingId(null)
  }

  async function removeExistingImage(p, idx) {
    const images = (p.images || []).filter((_,i) => i!==idx)
    await updateDoc(doc(collection(db, 'products'), p.id), { images })
    setList(prev => prev.map(x => x.id===p.id ? { ...x, images } : x))
  }

  useEffect(() => { loadProducts() }, [])

  useEffect(() => {
    // Live orders feed (latest 50)
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50))
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const logout = () => {
    sessionStorage.removeItem('admin_ok')
    setAuthorized(false)
    setKeyInput('')
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Admin Access</h1>
          <label className="block text-sm font-medium text-slate-700 mb-2">Admin Key</label>
          <input value={keyInput} onChange={(e) => setKeyInput(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="Enter admin key" />
          <button type="submit" className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-lg">Enter</button>
          {log && <div className="mt-3 text-red-600 text-sm">{log}</div>}
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white p-6 rounded-xl shadow-sm ring-1 ring-emerald-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Admin</h1>
            <button onClick={logout} className="text-slate-700 hover:text-emerald-700">Sign out</button>
          </div>
          <div className="space-y-4">
            {log && <div className="text-sm text-slate-700">{log}</div>}

            <div className="mt-6">
              <h2 className="font-semibold mb-3">Products ({list.length})</h2>
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Sizes (price / stock)</th>
                      <th className="text-left p-3">Active</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(p => (
                      <tr key={p.id} className="border-t">
                        <td className="p-3 whitespace-nowrap">{p.name}</td>
                        <td className="p-3 whitespace-nowrap">{p.category}</td>
                        <td className="p-3">
                          <div className="space-y-2">
                            {(p.sizes || []).map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{s.size}</span>
                                <input type="number" defaultValue={s.price} min={0} step={1}
                                  onBlur={async (e) => {
                                    const price = Number(e.target.value || 0)
                                    const sizes = [...(p.sizes||[])]
                                    sizes[idx] = { ...sizes[idx], price }
                                    await updateDoc(doc(collection(db,'products'), p.id), { sizes })
                                    setList(prev => prev.map(x => x.id===p.id ? { ...x, sizes } : x))
                                  }}
                                  className="w-20 border rounded px-2 py-1" />
                                <input type="number" defaultValue={s.stock} min={0} step={1}
                                  onBlur={async (e) => {
                                    const stock = Number(e.target.value || 0)
                                    const sizes = [...(p.sizes||[])]
                                    sizes[idx] = { ...sizes[idx], stock }
                                    await updateDoc(doc(collection(db,'products'), p.id), { sizes })
                                    setList(prev => prev.map(x => x.id===p.id ? { ...x, sizes } : x))
                                  }}
                                  className="w-20 border rounded px-2 py-1" />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">{p.active ? 'Yes' : 'No'}</td>
                        <td className="p-3 space-x-2">
                          <button onClick={() => toggleActive(p.id, p.active)} className="px-3 py-1 rounded-md border hover:bg-slate-50">
                            {p.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => { setEditingId(editingId===p.id ? null : p.id); setEditImagesData([]) }} className="px-3 py-1 rounded-md border hover:bg-slate-50">Edit images</button>
                        </td>
                      </tr>
                    ))}
                    {list.map(p => (
                      editingId === p.id ? (
                        <tr key={p.id+':edit'} className="border-t bg-slate-50/50">
                          <td colSpan={5} className="p-3">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(p.images || []).map((src, i) => (
                                <div key={i} className="relative">
                                  <img src={src} alt={'img'+i} className="w-16 h-16 object-cover rounded border" />
                                  <button onClick={() => removeExistingImage(p, i)} className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs">x</button>
                                </div>
                              ))}
                              {editImagesData.map((src, i) => (
                                <img key={'new'+i} src={src} alt={'new'+i} className="w-16 h-16 object-cover rounded border" />
                              ))}
                            </div>
                            <input type="file" accept="image/*" multiple onChange={(e)=>handleEditFiles(p, e)} />
                            <div className="mt-2 space-x-2">
                              <button onClick={() => saveNewImages(p)} className="px-3 py-1 rounded-md bg-emerald-700 text-white">Save images</button>
                              <button onClick={() => { setEditingId(null); setEditImagesData([]) }} className="px-3 py-1 rounded-md border">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : null
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-semibold mb-3">Create new product</h2>
              <NewProductForm onCreated={loadProducts} />
            </div>

            <div className="mt-10">
              <h2 className="font-semibold mb-3">Recent Orders ({orders.length})</h2>
              <div className="overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3">Order ID</th>
                      <th className="text-left p-3">Payment ID</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Items</th>
                      <th className="text-left p-3">Total</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const total = o?.totals?.total || 0
                      const itemsCount = Array.isArray(o?.items) ? o.items.reduce((n,i)=>n + (i.quantity||0), 0) : 0
                      const created = o?.createdAt?.toDate ? o.createdAt.toDate() : (o?.createdAt || null)
                      const dateStr = created ? new Date(created).toLocaleString() : '-'
                      const cust = o?.shippingAddress ? `${o.shippingAddress.firstName || ''} ${o.shippingAddress.lastName || ''}`.trim() : ''
                      return (
                        <tr key={o.id} className="border-t">
                          <td className="p-3 whitespace-nowrap">{o.orderId || o.id}</td>
                          <td className="p-3 whitespace-nowrap">{o.paymentId || '-'}</td>
                          <td className="p-3 whitespace-nowrap">{cust || '-'}</td>
                          <td className="p-3 whitespace-nowrap">{itemsCount}</td>
                          <td className="p-3 whitespace-nowrap">₹{total}</td>
                          <td className="p-3 whitespace-nowrap">{dateStr}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin

function NewProductForm({ onCreated }) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    category: 'naturals',
    description: '',
    fullDescription: '',
    benefits: '',
    ingredients: '',
    imagesText: '', // optional comma separated URLs
  })
  const [sizes, setSizes] = useState([{ size: '250g', weight: '0.25 kg', price: 0, originalPrice: 0, stock: 0 }])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [imagesData, setImagesData] = useState([]) // base64 strings

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setSizeField = (idx, k, v) => setSizes(prev => prev.map((s,i) => i===idx ? { ...s, [k]: v } : s))

  const addSize = () => setSizes(prev => [...prev, { size: '', weight: '', price: 0, originalPrice: 0, stock: 0 }])
  const removeSize = (idx) => setSizes(prev => prev.filter((_,i) => i!==idx))

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleFiles(e) {
    setMsg('')
    const files = Array.from(e.target.files || [])
    const accepted = []
    for (const f of files) {
      if (f.size > 1024 * 1024) {
        setMsg(prev => (prev ? prev + ' ' : '') + `${f.name} is over 1MB and was skipped.`)
        continue
      }
      try {
        const dataUrl = await fileToDataUrl(f)
        accepted.push(dataUrl)
      } catch {}
    }
    setImagesData(prev => [...prev, ...accepted])
  }

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    if (!form.id || !form.name) { setMsg('ID and Name are required'); return }
    if (sizes.length === 0) { setMsg('At least one size required'); return }
    const images = [
      ...imagesData,
      ...form.imagesText.split(',').map(s => s.trim()).filter(Boolean)
    ]
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      fullDescription: form.fullDescription,
      benefits: form.benefits,
      ingredients: form.ingredients,
      images,
      sizes: sizes.map(s => ({ ...s, price: Number(s.price||0), originalPrice: Number(s.originalPrice||0), stock: Number(s.stock||0) })),
      rating: 0,
      reviews: 0,
      active: true
    }
    try {
      setBusy(true)
      await setDoc(doc(collection(db, 'products'), String(form.id)), payload, { merge: false })
      setBusy(false)
      setMsg('Product created')
      if (onCreated) onCreated()
    } catch (e) {
      setBusy(false)
      setMsg(String(e?.message || e))
    }
  }

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded-lg shadow-sm ring-1 ring-slate-200 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">ID</label>
          <input value={form.id} onChange={e=>setField('id', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="unique id (e.g., 12)" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input value={form.name} onChange={e=>setField('name', e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select value={form.category} onChange={e=>setField('category', e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="foods">foods</option>
            <option value="naturals">naturals</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Images (comma-separated URLs)</label>
          <input value={form.imagesText} onChange={e=>setField('imagesText', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="/images/...1.jpg, /images/...2.jpg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Or upload images (≤ 1MB each)</label>
        <input type="file" accept="image/*" multiple onChange={handleFiles} className="block" />
        {imagesData.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {imagesData.map((src, i) => (
              <img key={i} src={src} alt={"preview "+i} className="w-16 h-16 object-cover rounded border" />
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Short Description</label>
        <textarea value={form.description} onChange={e=>setField('description', e.target.value)} className="w-full border rounded px-3 py-2" rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Full Description</label>
        <textarea value={form.fullDescription} onChange={e=>setField('fullDescription', e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Benefits</label>
          <input value={form.benefits} onChange={e=>setField('benefits', e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ingredients</label>
          <input value={form.ingredients} onChange={e=>setField('ingredients', e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sizes</h3>
          <button type="button" onClick={addSize} className="text-sm px-2 py-1 border rounded">Add size</button>
        </div>
        {sizes.map((s, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
            <input value={s.size} onChange={e=>setSizeField(idx,'size',e.target.value)} className="border rounded px-2 py-1" placeholder="size (e.g., 250g)" />
            <input value={s.weight} onChange={e=>setSizeField(idx,'weight',e.target.value)} className="border rounded px-2 py-1" placeholder="weight (e.g., 0.25 kg)" />
            <input type="number" value={s.price} onChange={e=>setSizeField(idx,'price',e.target.value)} className="border rounded px-2 py-1" placeholder="price" />
            <input type="number" value={s.originalPrice} onChange={e=>setSizeField(idx,'originalPrice',e.target.value)} className="border rounded px-2 py-1" placeholder="original" />
            <div className="flex items-center gap-2">
              <input type="number" value={s.stock} onChange={e=>setSizeField(idx,'stock',e.target.value)} className="border rounded px-2 py-1 w-full" placeholder="stock" />
              <button type="button" onClick={()=>removeSize(idx)} className="text-sm px-2 py-1 border rounded">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold px-4 py-2 rounded-lg">{busy ? 'Saving...' : 'Create product'}</button>
        {msg && <div className="text-sm text-slate-700">{msg}</div>}
      </div>
    </form>
  )
}


