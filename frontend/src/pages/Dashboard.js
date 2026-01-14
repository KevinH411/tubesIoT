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

    // Fetch daftar tanah saat komponen dimuat atau user berubah
    useEffect(() => {
        if (user && user.id) {
            fetchTanahList(user.id)
        }
    }, [user])

    const fetchTanahList = async (userId) => {
        try {
            setLoading(true)
            // Mengambil tanah yang hanya bisa diakses oleh user yang sedang login
            const response = await axios.get(
                `http://localhost:8080/api/tanah?userId=${userId}`
            )
            const data = Array.isArray(response.data) ? response.data : []
            setTanahList(data)
            if (data.length === 0) {
                console.warn('Tidak ada data tanah ditemukan untuk user ini.')
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
            // Mengirim selectedLahan sebagai query parameter agar backend tahu data ini milik lahan mana
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
                                onChange={(e) =>
                                    setSelectedTanah(e.target.value)
                                }
                                disabled={loading && tanahList.length === 0}
                            >
                                <option value="">
                                    {loading
                                        ? 'Memuat...'
                                        : '-- Pilih Tanah --'}
                                </option>
                                {Array.isArray(tanahList) &&
                                    tanahList.map((tanah) => (
                                        <option
                                            key={tanah.idTanah}
                                            value={tanah.idTanah}
                                        >
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
                                onChange={(e) =>
                                    setSelectedLahan(e.target.value)
                                }
                                disabled={!selectedTanah || loading}
                            >
                                <option value="">-- Pilih Lahan --</option>
                                {Array.isArray(lahanList) &&
                                    lahanList.map((lahan) => (
                                        <option
                                            key={lahan.idLahan}
                                            value={lahan.idLahan}
                                        >
                                            {lahan.note}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <button
                            className="ok-btn"
                            onClick={handleOkClick}
                            disabled={!selectedLahan || loading}
                        >
                            {loading ? 'Memproses...' : 'OK'}
                        </button>
                    </div>
                </div>

                {dataLoaded && (
                    <div className="data-section">
                        <div className="section-header">
                            <h2>Data Sensor</h2>
                            <button
                                className="trigger-btn"
                                onClick={handleTriggerRead}
                                disabled={loading}
                            >
                                {loading
                                    ? 'Memproses...'
                                    : '+ Tambah Data dari Sensor'}
                            </button>
                        </div>

                        {!Array.isArray(sensorData) ||
                        sensorData.length === 0 ? (
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
                                                <td>
                                                    {data.timestamp
                                                        ? new Date(
                                                              data.timestamp
                                                          ).toLocaleString(
                                                              'id-ID'
                                                          )
                                                        : '-'}
                                                </td>
                                                <td>{data.soilMoisture}</td>
                                                <td>
                                                    {typeof data.temperature ===
                                                    'number'
                                                        ? data.temperature.toFixed(
                                                              2
                                                          )
                                                        : data.temperature}
                                                </td>
                                                <td>
                                                    {typeof data.ph === 'number'
                                                        ? data.ph.toFixed(2)
                                                        : data.ph}
                                                </td>
                                                <td>
                                                    {typeof data.light ===
                                                    'number'
                                                        ? data.light.toFixed(2)
                                                        : data.light}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard
