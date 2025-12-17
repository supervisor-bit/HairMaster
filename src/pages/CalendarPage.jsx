import { useState } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { useClients } from '../hooks/useClients';

export function CalendarPage({ onNavigate }) {
    const { appointments, addAppointment, deleteAppointment, updateAppointment } = useAppointments();
    const { clients, addClient } = useClients();

    // State for viewing month
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // When a day is clicked

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ clientId: '', time: '10:00', duration: 60, note: '' });
    const [clientSearch, setClientSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [conflictWarning, setConflictWarning] = useState(null);
    const [customWeeks, setCustomWeeks] = useState('');

    // Quick Create Client State
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientData, setNewClientData] = useState({ name: '', phone: '' });

    // Filtered clients for autocomplete
    const filteredClients = clients.filter(c => {
        const searchNormalized = clientSearch.toLowerCase().trim();
        const searchDigits = searchNormalized.replace(/\s+/g, '');

        const matchesName = c.name.toLowerCase().includes(searchNormalized);
        const matchesPhone = c.phone ? c.phone.replace(/\s+/g, '').includes(searchDigits) : false;

        return matchesName || matchesPhone;
    }).slice(0, 5); // Limit to 5 suggestions

    // Calendar logic
    const getLocalISODate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...

        // Adjust for Monday start (ISO 8601ish for CZ)
        const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < adjustedFirstDay; i++) {
            days.push(null);
        }
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const days = getDaysInMonth(currentDate);

    // Helpers
    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
        setSelectedDate(null);
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const getAppointmentsForDay = (date) => {
        if (!date) return [];
        const strDate = getLocalISODate(date);
        return appointments
            .filter(a => a.date === strDate)
            .sort((a, b) => a.time.localeCompare(b.time));
    };

    const getWeekNumber = (date) => {
        if (!date) return '';
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const handleDayClick = (day) => {
        if (day) setSelectedDate(day);
    };

    const openModal = (prefillTime = '09:00') => {
        setFormData({ clientId: '', time: prefillTime, duration: 60, note: '' });
        setClientSearch('');
        setShowSuggestions(false);
        setConflictWarning(null);
        setEditingId(null);
        setCustomWeeks('');
        setIsCreatingClient(false);
        setNewClientData({ name: '', phone: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (appointment) => {
        const client = clients.find(c => c.id === appointment.clientId);
        setFormData({
            clientId: appointment.clientId,
            time: appointment.time,
            duration: appointment.duration || 60,
            note: appointment.note || ''
        });
        setClientSearch(client ? client.name : '');
        setConflictWarning(null);
        setEditingId(appointment.id);
        setCustomWeeks('');
        setIsCreatingClient(false);
        setIsModalOpen(true);
    };

    const checkConflict = (dateStr, time, duration) => {
        const apps = appointments.filter(a => a.date === dateStr);
        if (apps.length === 0) return null;

        const newStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
        const newEnd = newStart + duration;

        const conflict = apps.find(a => {
            const start = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
            const end = start + (a.duration || 60);
            return (newStart < end && newEnd > start);
        });

        if (conflict) {
            const client = clients.find(c => c.id === conflict.clientId);
            return `Kolize s: ${client?.name || 'Neznámý'} (${conflict.time})`;
        }
        return null;
    };

    const planNextVisit = (weeksOffset) => {
        if (!selectedDate) return;

        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (weeksOffset * 7));

        setCurrentDate(newDate); // Move calendar view
        setSelectedDate(newDate); // Select the new day
        setEditingId(null); // Switch to create mode
        setCustomWeeks('');

        // Validation
        const dateStr = getLocalISODate(newDate);
        const warning = checkConflict(dateStr, formData.time, formData.duration);
        setConflictWarning(warning);
    };

    const handleSave = (e) => {
        e.preventDefault();

        // Logic for creating new client on the fly
        let finalClientId = formData.clientId;

        if (isCreatingClient) {
            if (!newClientData.name) return; // Basic validation

            const newClient = addClient({
                name: newClientData.name,
                phone: newClientData.phone,
                email: '',
                notes: ''
            });
            finalClientId = newClient.id;
        } else {
            if (!selectedDate || !formData.clientId) return;
        }

        const appointmentData = {
            clientId: finalClientId,
            date: getLocalISODate(selectedDate),
            time: formData.time,
            duration: Number(formData.duration),
            note: formData.note
        };

        if (editingId) {
            updateAppointment(editingId, appointmentData);
        } else {
            addAppointment(appointmentData);
        }

        setIsModalOpen(false);
    };

    const monthNames = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];

    return (
        <div className="page-layout fade-in">
            <header className="page-header">
                <div>
                    <h2 style={{ fontSize: '1.875rem' }}>Kalendář</h2>
                    <p className="text-muted">Přehled objednávek</p>
                </div>
            </header>

            <div className="content-area" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--spacing-lg)', height: '100%', overflow: 'hidden' }}>

                {/* Calendar Grid */}
                <div className="card full-height-card" style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Month Nav */}
                    <div className="flex-between mb-lg" style={{ padding: '0 var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => changeMonth(-1)}>← Předchozí</button>
                            <button className="btn btn-secondary btn-sm" onClick={goToToday}>Dnes</button>
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <button className="btn btn-ghost" onClick={() => changeMonth(1)}>Další →</button>
                    </div>

                    {/* Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: '8px', marginBottom: '8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '0.8rem', paddingTop: '2px' }}>Týden</div><div>Po</div><div>Út</div><div>St</div><div>Čt</div><div>Pá</div><div>So</div><div>Ne</div>
                    </div>

                    {/* Weeks Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        {weeks.map((week, weekIdx) => {
                            // Calculate week number from the first valid day in the week
                            const firstDay = week.find(d => d);
                            const weekNum = firstDay ? getWeekNumber(firstDay) : '';
                            const isOdd = weekNum % 2 !== 0;

                            return (
                                <div key={weekIdx} style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: '8px', flex: 1 }}>
                                    {/* Week Number Cell */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.9rem', fontWeight: 600,
                                        color: isOdd ? 'var(--primary)' : 'var(--text-secondary)',
                                        background: isOdd ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                                        borderRadius: '8px'
                                    }}>
                                        {weekNum}
                                    </div>

                                    {/* Days */}
                                    {week.map((day, dayIdx) => {
                                        if (!day) return <div key={dayIdx} />;

                                        const dayApps = getAppointmentsForDay(day);
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

                                        return (
                                            <div
                                                key={dayIdx}
                                                onClick={() => handleDayClick(day)}
                                                style={{
                                                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                                    borderRadius: '12px',
                                                    background: isToday ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-tertiary)',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'flex-start',
                                                    position: 'relative',
                                                    transition: 'all 0.2s',
                                                    opacity: day.getMonth() !== currentDate.getMonth() ? 0.5 : 1
                                                }}
                                                className="hover:bg-slate-700"
                                            >
                                                <span style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    color: isToday ? 'var(--primary)' : 'inherit',
                                                    marginBottom: '4px'
                                                }}>
                                                    {day.getDate()}
                                                </span>

                                                {/* Dots for appointments */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {dayApps.map((a, idx) => (
                                                        <div key={idx} style={{
                                                            width: '8px', height: '8px',
                                                            borderRadius: '50%',
                                                            background: 'var(--accent)'
                                                        }} />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Side Panel: Selected Day Agenda */}
                <div className="card full-height-card">
                    <h3 className="mb-lg" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        {selectedDate ? selectedDate.toLocaleDateString('cs-CZ') : 'Vyberte den'}
                    </h3>

                    <div className="card-scroll-area">
                        {selectedDate ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {/* Timeline Slots */}
                                {Array.from({ length: 13 }).map((_, i) => {
                                    const hour = i + 8; // Start at 8:00
                                    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;

                                    // Find appointments in this hour (simple logic: matches hour part)
                                    // Note: This matches e.g. 10:00, 10:15, 10:30 all to the 10:00 slot visually for now
                                    const slotApps = appointments.filter(a => {
                                        return a.date === getLocalISODate(selectedDate) &&
                                            parseInt(a.time.split(':')[0]) === hour;
                                    }).sort((a, b) => a.time.localeCompare(b.time));

                                    return (
                                        <div
                                            key={hour}
                                            style={{
                                                borderBottom: '1px solid var(--border-color)',
                                                minHeight: '60px',
                                                display: 'flex',
                                                position: 'relative',
                                                cursor: 'pointer' // Whole row is clickable
                                            }}
                                            className="hover:bg-slate-800"
                                            onClick={() => openModal(timeSlot)} // Creating overlap by default
                                        >
                                            {/* Time Label */}
                                            <div style={{
                                                width: '50px',
                                                borderRight: '1px solid var(--border-color)',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                paddingTop: '8px',
                                                color: 'var(--text-secondary)',
                                                fontWeight: 500,
                                                fontSize: '0.85rem'
                                            }}>
                                                {timeSlot}
                                            </div>

                                            {/* Content Area */}
                                            <div style={{ flex: 1, padding: '4px' }}>
                                                {slotApps.length > 0 && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {slotApps.map(app => {
                                                            const client = clients.find(c => c.id === app.clientId);

                                                            // Calculate end time helper
                                                            const getEndTime = (start, durationMins) => {
                                                                const [h, m] = start.split(':').map(Number);
                                                                const totalMinutes = h * 60 + m + (durationMins || 60);
                                                                const newH = Math.floor(totalMinutes / 60);
                                                                const newM = totalMinutes % 60;
                                                                return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
                                                            };

                                                            const endTime = getEndTime(app.time, app.duration);

                                                            return (
                                                                <div
                                                                    key={app.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation(); // Don't trigger 'add new' when clicking existing
                                                                        handleEdit(app);
                                                                    }}
                                                                    style={{
                                                                        padding: '8px 12px',
                                                                        borderRadius: '6px',
                                                                        background: 'var(--bg-input)',
                                                                        borderLeft: '4px solid var(--accent)',
                                                                        position: 'relative',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.9rem'
                                                                    }}
                                                                    className="hover:bg-slate-700"
                                                                >
                                                                    <div style={{ fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                        <span style={{
                                                                            color: 'var(--primary)',
                                                                            fontSize: '0.8rem',
                                                                            background: 'rgba(139, 92, 246, 0.1)',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '4px'
                                                                        }}>
                                                                            {app.time} - {endTime}
                                                                        </span>
                                                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {client?.name || 'Neznámý klient'}
                                                                        </span>
                                                                    </div>
                                                                    {app.note && (
                                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', marginLeft: '50px' }}>
                                                                            {app.note}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {/* Hidden 'Add' overlay hint could go here, but row click is enough */}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                                Kliknutím na den zobrazíte rozvrh.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Simple Appointment Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card fade-in" style={{ width: '400px', maxWidth: '90%' }}>
                        <h3 className="mb-lg">{editingId ? 'Úprava termínu' : 'Nový termín'}: {selectedDate?.toLocaleDateString()}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <div className="flex-between">
                                    <label className="label">Klient</label>
                                    {!editingId && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '0 8px', fontSize: '0.8rem', color: isCreatingClient ? 'var(--text-muted)' : 'var(--primary)' }}
                                            onClick={() => {
                                                setIsCreatingClient(!isCreatingClient);
                                                setFormData(prev => ({ ...prev, clientId: '' }));
                                                setClientSearch('');
                                            }}
                                        >
                                            {isCreatingClient ? '← Hledat existujícího' : '+ Nový klient'}
                                        </button>
                                    )}
                                </div>

                                {isCreatingClient ? (
                                    <div style={{ display: 'grid', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Jméno a příjmení"
                                            value={newClientData.name}
                                            onChange={e => setNewClientData({ ...newClientData, name: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Telefon (nepovinné)"
                                            value={newClientData.phone}
                                            onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Začněte psát jméno..."
                                            value={clientSearch}
                                            onChange={e => {
                                                setClientSearch(e.target.value);
                                                setShowSuggestions(true);
                                                setFormData(prev => ({ ...prev, clientId: '' }));
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                            required={!isCreatingClient}
                                            readOnly={!!editingId}
                                        />
                                        {showSuggestions && clientSearch && !editingId && (
                                            <div className="card fade-in" style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                zIndex: 10, padding: 0, marginTop: '4px',
                                                maxHeight: '200px', overflowY: 'auto',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                                            }}>
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, clientId: c.id }));
                                                                setClientSearch(c.name);
                                                                setShowSuggestions(false);
                                                            }}
                                                            style={{
                                                                padding: '12px',
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid var(--border-color)',
                                                                background: 'var(--bg-secondary)'
                                                            }}
                                                            className="hover:bg-slate-700"
                                                        >
                                                            {c.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '12px', color: 'var(--text-muted)' }}>
                                                        Žádný klient nenalezen
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="label">Čas</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Délka</label>
                                    <select
                                        className="input"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                    >
                                        <option value={30}>30 min</option>
                                        <option value={60}>1 hod</option>
                                        <option value={90}>1.5 hod</option>
                                        <option value={120}>2 hod</option>
                                        <option value={150}>2.5 hod</option>
                                        <option value={180}>3 hod</option>
                                        <option value={210}>3.5 hod</option>
                                        <option value={240}>4 hod</option>
                                        <option value={270}>4.5 hod</option>
                                        <option value={300}>5 hod</option>
                                    </select>
                                </div>
                            </div>

                            {conflictWarning && (
                                <div style={{
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid var(--danger)',
                                    borderRadius: '8px',
                                    color: '#f87171',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    ⚠️ {conflictWarning}
                                </div>
                            )}

                            <div>
                                <label className="label">Poznámka (Služba)</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Např. Střih + Barva"
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>

                            {editingId && (
                                <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
                                    <label className="label mb-sm" style={{ display: 'block' }}>Naplánovat další návštěvu:</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                        {[4, 5, 6, 8].map(weeks => (
                                            <button
                                                key={weeks}
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => planNextVisit(weeks)}
                                            >
                                                +{weeks} týd.
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="number"
                                            className="input"
                                            style={{ flex: 1, padding: '4px 8px' }}
                                            placeholder="Jiné..."
                                            value={customWeeks}
                                            onChange={(e) => setCustomWeeks(e.target.value)}
                                            min="1"
                                            max="52"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            disabled={!customWeeks}
                                            onClick={() => planNextVisit(Number(customWeeks))}
                                        >
                                            Naplánovat
                                        </button>
                                    </div>
                                </div>
                            )}

                            {editingId && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ marginTop: '16px', width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                                    onClick={() => {
                                        onNavigate('clients', {
                                            openClientDetail: formData.clientId,
                                            startVisit: true,
                                            appointmentNote: formData.note
                                        });
                                    }}
                                >
                                    🚀 Zahájit návštěvu (Příchod klienta)
                                </button>
                            )}

                            <div className="flex-between" style={{ marginTop: '8px' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Zrušit</button>
                                <button type="submit" className="btn btn-primary">Uložit termín</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
