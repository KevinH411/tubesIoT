import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Dashboard.css'

function Dashboard({ user, onLogout }) {
    const [tanahList, setTanahList] = useState([])
    const [lahanList, setLahanList] = useState([])
    const [sensorData, setSensorData] = useState([])
    const [selectedTanah, setSelectedTanah] = useState('')
    const [selectedLahan, setSelectedLahan] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [dataLoaded, setDataLoaded] = useState(false)

    // New UI states for modals / create forms
    const [showCreateTanah, setShowCreateTanah] = useState(false)
    const [showCreateLahan, setShowCreateLahan] = useState(false)

    const [newTanahPemilik, setNewTanahPemilik] = useState('')
    const [newTanahAddress, setNewTanahAddress] = useState('')

    const [newLahanTanahId, setNewLahanTanahId] = useState('')
    const [newLahanNote, setNewLahanNote] = useState('')
    const [creating, setCreating] = useState(false)

    // Fetch daftar tanah saat komponen dimuat atau user berubah
    useEffect(() => {
        if (user && user.id) {
            fetchTanahList(user.id)
        }
    }, [user])

    const fetchTanahList = async (userId) => {
        try {
            setLoading(true)
            const response = await axios.get(
                `http://localhost:8080/api/tanah?userId=${userId}`
            )
            const data = Array.isArray(response.data) ? response.data : []
            setTanahList(data)
            if (data.length === 0) {
                console.warn('Tidak ada data tanah ditemukan untuk user ini.')
            } else {
                // if no selectedTanah, set default for convenience
                if (!selectedTanah) {
                    setSelectedTanah(String(data[0].idTanah || data[0].id_tanah))
                }
            }
        } catch (err) {
            console.error('Error fetching tanah:', err)
            setError('Gagal mengambil data tanah')
            setTanahList([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch lahan ketika tanah berubah
    useEffect(() => {
        if (selectedTanah) {
            fetchLahanByTanah(selectedTanah)
        } else {
            setLahanList([])
            setSelectedLahan('')
        }
    }, [selectedTanah])

    const fetchLahanByTanah = async (tanahId) => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/lahan/by-tanah/${tanahId}`
            )
            const data = Array.isArray(response.data) ? response.data : []
            setLahanList(data)
            setSelectedLahan('')
        } catch (err) {
            console.error('Error fetching lahan:', err)
            setError('Gagal mengambil data lahan')
            setLahanList([])
        }
    }

    const handleOkClick = async () => {
        if (!selectedLahan) {
            setError('Silakan pilih lahan terlebih dahulu')
            return
        }

        setLoading(true)
        setError('')
        setDataLoaded(false)

        try {
            const response = await axios.get(
                `http://localhost:8080/api/sensors/history/${selectedLahan}`
            )
            const data =
                response.data.data ||
                (Array.isArray(response.data) ? response.data : [])
            setSensorData(data)
            setDataLoaded(true)
        } catch (err) {
            console.error('Error fetching sensor data:', err)
            setError('Gagal mengambil data sensor')
            setSensorData([])
            setDataLoaded(true)
        } finally {
            setLoading(false)
        }
    }

    const handleTriggerRead = async () => {
        try {
            setLoading(true)
            await axios.post(
                `http://localhost:8080/api/sensors/trigger-read?lahanId=${selectedLahan}`
            )
            alert('Perintah pembacaan sensor telah dikirim')

            // Refresh data setelah beberapa detik
            setTimeout(() => {
                if (selectedLahan) {
                    handleOkClick()
                }
            }, 2000)
        } catch (err) {
            console.error('Error triggering sensor read:', err)
            alert('Gagal mengirim perintah pembacaan sensor')
        } finally {
            setLoading(false)
        }
    }

    // ---------- Create Tanah ----------
    const openCreateTanah = () => {
        setNewTanahPemilik('')
        setNewTanahAddress('')
        setShowCreateTanah(true)
    }
    const closeCreateTanah = () => setShowCreateTanah(false)

    const submitCreateTanah = async (e) => {
        e.preventDefault()
        if (!newTanahPemilik.trim() || !newTanahAddress.trim()) {
            alert('Isi semua field Tanah terlebih dahulu')
            return
        }
        try {
            setCreating(true)
            const payload = { pemilik: newTanahPemilik.trim(), address: newTanahAddress.trim(), userId: user.id }
            const response = await axios.post('http://localhost:8080/api/tanah', payload)
            const created = response.data || {}
            alert('Tanah berhasil dibuat')
            closeCreateTanah()
            if (user && user.id) {
                await fetchTanahList(user.id)
            }
            const newId = created.idTanah || created.id_tanah || null
            if (newId) {
                setSelectedTanah(String(newId))
            }
        } catch (err) {
            console.error('Error creating tanah:', err)
            alert('Gagal membuat tanah')
        } finally {
            setCreating(false)
        }
    }

    // ---------- Create Lahan ----------
    const openCreateLahan = () => {
        // default parent tanah = current selectedTanah or first in list
        setNewLahanTanahId(selectedTanah || String(tanahList[0]?.idTanah || tanahList[0]?.id_tanah || ''))
        setNewLahanNote('')
        setShowCreateLahan(true)
    }
    const closeCreateLahan = () => setShowCreateLahan(false)

    const submitCreateLahan = async (e) => {
        e.preventDefault()
        if (!newLahanTanahId || !newLahanNote.trim()) {
            alert('Pilih Tanah dan isi Note untuk lahan')
            return
        }
        try {
            setCreating(true)
            const payload = { idTanah: Number(newLahanTanahId), note: newLahanNote.trim() }
            const response = await axios.post('http://localhost:8080/api/lahan', payload)
            const created = response.data || {}
            alert('Lahan berhasil dibuat')
            closeCreateLahan()
            const parentId = Number(newLahanTanahId)
            if (parentId) {
                setSelectedTanah(String(parentId))
                await fetchLahanByTanah(parentId)
            }
            const newLahanId = created.idLahan || created.id_lahan || null
            if (newLahanId) {
                setSelectedLahan(String(newLahanId))
            }
        } catch (err) {
            console.error('Error creating lahan:', err)
            alert('Gagal membuat lahan')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>IoT Monitoring Dashboard</h1>
                    <p>Smart Farming System</p>
                </div>
                <div className="header-right">
                    <span className="user-info">
                        Selamat datang, <strong>{user?.username}</strong>
                    </span>
                    <button className="logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="filter-section">
                    <h2>Pilih Data Lahan</h2>

                    {error && <div className="error-message">{error}</div>}

                    <div className="filter-controls">
                        <div className="filter-group">
                            <label htmlFor="tanah-select">Tanah</label>
                            <select
                                id="tanah-select"
                                value={selectedTanah}
                                onChange={(e) => setSelectedTanah(e.target.value)}
                                disabled={loading && tanahList.length === 0}
                            >
                                <option value="">{loading ? 'Memuat...' : '-- Pilih Tanah --'}</option>
                                {Array.isArray(tanahList) &&
                                    tanahList.map((tanah) => (
                                        <option key={tanah.idTanah || tanah.id_tanah} value={tanah.idTanah || tanah.id_tanah}>
                                            {tanah.pemilik} - {tanah.address}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="lahan-select">Lahan</label>
                            <select
                                id="lahan-select"
                                value={selectedLahan}
                                onChange={(e) => setSelectedLahan(e.target.value)}
                                disabled={!selectedTanah || loading}
                            >
                                <option value="">-- Pilih Lahan --</option>
                                {Array.isArray(lahanList) &&
                                    lahanList.map((lahan) => (
                                        <option key={lahan.idLahan || lahan.id_lahan} value={lahan.idLahan || lahan.id_lahan}>
                                            {lahan.note}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button className="trigger-btn" onClick={openCreateLahan} disabled={loading || !selectedTanah}>
                                {loading ? 'Memproses...' : '+ Buat Lahan'}
                            </button>

                            <button className="trigger-btn" onClick={openCreateTanah} disabled={loading}>
                                {loading ? 'Memproses...' : '+ Buat Tanah'}
                            </button>
                        </div>

                        <button className="ok-btn" onClick={handleOkClick} disabled={!selectedLahan || loading}>
                            {loading ? 'Memproses...' : 'OK'}
                        </button>
                    </div>
                </div>

                {dataLoaded && (
                    <div className="data-section">
                        <div className="section-header">
                            <h2>Data Sensor</h2>

                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button className="trigger-btn" onClick={handleTriggerRead} disabled={loading}>
                                    {loading ? 'Memproses...' : '+ Tambah Data dari Sensor'}
                                </button>
                            </div>
                        </div>

                        {!Array.isArray(sensorData) || sensorData.length === 0 ? (
                            <div className="no-data-message">
                                <p>Tidak ada data sensor untuk lahan ini</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="sensor-table">
                                    <thead>
                                        <tr>
                                            <th>No</th>
                                            <th>Waktu</th>
                                            <th>Kelembapan Tanah (%)</th>
                                            <th>Suhu (°C)</th>
                                            <th>pH</th>
                                            <th>Cahaya (Lux)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sensorData.map((data, index) => (
                                            <tr key={data.id || index}>
                                                <td>{index + 1}</td>
                                                <td>{data.timestamp ? new Date(data.timestamp).toLocaleString('id-ID') : '-'}</td>
                                                <td>{data.soilMoisture}</td>
                                                <td>{typeof data.temperature === 'number' ? data.temperature.toFixed(2) : data.temperature}</td>
                                                <td>{typeof data.ph === 'number' ? data.ph.toFixed(2) : data.ph}</td>
                                                <td>{typeof data.light === 'number' ? data.light.toFixed(2) : data.light}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Create Tanah Modal */}
            {showCreateTanah && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Buat Tanah Baru</h3>
                        </div>
                        <form className="modal-body" onSubmit={submitCreateTanah}>
                            <label>
                                Pemilik
                                <input value={newTanahPemilik} onChange={(e) => setNewTanahPemilik(e.target.value)} />
                            </label>
                            <label>
                                Address
                                <input value={newTanahAddress} onChange={(e) => setNewTanahAddress(e.target.value)} />
                            </label>
                            <div className="modal-footer">
                                <button type="button" className="btn" onClick={closeCreateTanah} disabled={creating}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Membuat...' : 'Buat Tanah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Lahan Modal */}
            {showCreateLahan && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Buat Lahan Baru</h3>
                        </div>
                        <form className="modal-body" onSubmit={submitCreateLahan}>
                            <label>
                                Pilih Tanah
                                <select value={newLahanTanahId} onChange={(e) => setNewLahanTanahId(e.target.value)}>
                                    <option value="">-- Pilih Tanah --</option>
                                    {tanahList.map((t) => (
                                        <option key={t.idTanah || t.id_tanah} value={t.idTanah || t.id_tanah}>
                                            {t.pemilik} - {t.address}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Note
                                <input value={newLahanNote} onChange={(e) => setNewLahanNote(e.target.value)} />
                            </label>

                            <div className="modal-footer">
                                <button type="button" className="btn" onClick={closeCreateLahan} disabled={creating}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Membuat...' : 'Buat Lahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
