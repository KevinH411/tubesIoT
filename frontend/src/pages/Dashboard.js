import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Dashboard.css'

function Dashboard({ user, onLogout }) {
    const [tanahList, setTanahList] = useState([])
    const [lokasiList, setLokasiList] = useState([])
    const [sensorData, setSensorData] = useState([])
    const [selectedTanah, setSelectedTanah] = useState('')
    const [selectedLokasi, setSelectedLokasi] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [dataLoaded, setDataLoaded] = useState(false)

    const [showCreateTanah, setShowCreateTanah] = useState(false)
    const [showCreateLokasi, setShowCreateLokasi] = useState(false)

    const [newTanahPemilik, setNewTanahPemilik] = useState('')
    const [newTanahAddress, setNewTanahAddress] = useState('')

    const [newLokasiTanahId, setNewLokasiTanahId] = useState('')
    const [newLokasiNote, setNewLokasiNote] = useState('')
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

    // Fetch lokasi ketika tanah berubah
    useEffect(() => {
        if (selectedTanah) {
            fetchLokasiByTanah(selectedTanah)
        } else {
            setLokasiList([])
            setSelectedLokasi('')
        }
    }, [selectedTanah])

    const fetchLokasiByTanah = async (tanahId) => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/lokasi/by-tanah/${tanahId}`
            )
            const data = Array.isArray(response.data) ? response.data : []
            setLokasiList(data)
            setSelectedLokasi('')
        } catch (err) {
            console.error('Error fetching lokasi:', err)
            setError('Gagal mengambil data lokasi')
            setLokasiList([])
        }
    }

    const handleOkClick = async () => {
        if (!selectedLokasi) {
            setError('Silakan pilih lokasi terlebih dahulu')
            return
        }

        setLoading(true)
        setError('')
        setDataLoaded(false)

        try {
            const response = await axios.get(
                `http://localhost:8080/api/sensors/history/${selectedLokasi}`
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
                `http://localhost:8080/api/sensors/trigger-read?lokasiId=${selectedLokasi}`
            )
            alert('Perintah pembacaan sensor telah dikirim')

            // Refresh data setelah beberapa detik
            setTimeout(() => {
                if (selectedLokasi) {
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

    // ---------- Create Lokasi ----------
    const openCreateLokasi = () => {
        // default parent tanah = current selectedTanah or first in list
        setNewLokasiTanahId(selectedTanah || String(tanahList[0]?.idTanah || tanahList[0]?.id_tanah || ''))
        setNewLokasiNote('')
        setShowCreateLokasi(true)
    }
    const closeCreateLokasi = () => setShowCreateLokasi(false)

    const submitCreateLokasi = async (e) => {
        e.preventDefault()
        if (!newLokasiTanahId || !newLokasiNote.trim()) {
            alert('Pilih Tanah dan isi Note untuk lokasi')
            return
        }
        try {
            setCreating(true)
            const payload = { idTanah: Number(newLokasiTanahId), note: newLokasiNote.trim() }
            const response = await axios.post('http://localhost:8080/api/lokasi', payload)
            const created = response.data || {}
            alert('Lokasi berhasil dibuat')
            closeCreateLokasi()
            const parentId = Number(newLokasiTanahId)
            if (parentId) {
                setSelectedTanah(String(parentId))
                await fetchLokasiByTanah(parentId)
            }
            const newLokasiId = created.idLokasi || created.id_lokasi || null
            if (newLokasiId) {
                setSelectedLokasi(String(newLokasiId))
            }
        } catch (err) {
            console.error('Error creating lokasi:', err)
            alert('Gagal membuat lokasi')
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
                    <h2>Pilih Data Lokasi</h2>

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
                            <label htmlFor="lokasi-select">Lokasi</label>
                            <select
                                id="lokasi-select"
                                value={selectedLokasi}
                                onChange={(e) => setSelectedLokasi(e.target.value)}
                                disabled={!selectedTanah || loading}
                            >
                                <option value="">-- Pilih Lokasi --</option>
                                {Array.isArray(lokasiList) &&
                                    lokasiList.map((lokasi) => (
                                        <option key={lokasi.idLokasi || lokasi.id_lokasi} value={lokasi.idLokasi || lokasi.id_lokasi}>
                                            {lokasi.note}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button className="trigger-btn" onClick={openCreateLokasi} disabled={loading || !selectedTanah}>
                                {loading ? 'Memproses...' : '+ Buat Lokasi'}
                            </button>

                            <button className="trigger-btn" onClick={openCreateTanah} disabled={loading}>
                                {loading ? 'Memproses...' : '+ Buat Tanah'}
                            </button>
                        </div>

                        <button className="ok-btn" onClick={handleOkClick} disabled={!selectedLokasi || loading}>
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
                                <p>Tidak ada data sensor untuk lokasi ini</p>
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

            {/* Create Tanah */}
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

            {/* Create Lokasi */}
            {showCreateLokasi && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Buat Lokasi Baru</h3>
                        </div>
                        <form className="modal-body" onSubmit={submitCreateLokasi}>
                            <label>
                                Pilih Tanah
                                <select value={newLokasiTanahId} onChange={(e) => setNewLokasiTanahId(e.target.value)}>
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
                                <input value={newLokasiNote} onChange={(e) => setNewLokasiNote(e.target.value)} />
                            </label>

                            <div className="modal-footer">
                                <button type="button" className="btn" onClick={closeCreateLokasi} disabled={creating}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Membuat...' : 'Buat Lokasi'}
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
