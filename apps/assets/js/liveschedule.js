import { database, ref, get, set, remove, onValue, auth, onAuthStateChanged } from './firebase-init.js';

        let createListenerRegistry = () => {
            const cleanups = new Set();
            return {
                track(unsubscribe) {
                    if (typeof unsubscribe === 'function') cleanups.add(unsubscribe);
                    return unsubscribe;
                },
                clearAll() {
                    for (const unsubscribe of cleanups) {
                        try { unsubscribe(); } catch { }
                    }
                    cleanups.clear();
                }
            };
        };

        import('./listeners.js')
            .then((mod) => {
                if (typeof mod.createListenerRegistry === 'function') {
                    createListenerRegistry = mod.createListenerRegistry;
                }
            })
            .catch(() => {
                console.warn('listeners helper missing; using local fallback in liveschedule.');
            });

        let calendar;
        const modal = document.getElementById("appointmentModal");
        const closeBtn = document.querySelector(".close");
        const form = document.getElementById("appointmentForm");
        const deleteButton = document.getElementById('deleteButton');
        let DATABASE_BASE_PATH = 'public';
        const listeners = createListenerRegistry();

        document.addEventListener('DOMContentLoaded', function () {
            const calendarEl = document.getElementById('calendar');

            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listWeek'
                },
                views: {
                    dayGridMonth: { buttonText: 'Month View' },
                    listWeek: { type: 'list', duration: { month: 1 }, buttonText: 'List View' }
                },
                dateClick: function (info) {
                    openModalForNewAppointment(info.dateStr);
                },
                eventClick: function (info) {
                    openModalForExistingTask(info.event);
                },
                events: []
            });

            calendar.render();

            setupFirebaseListener();
        });

        function setupFirebaseListener() {
            onAuthStateChanged(auth, (user) => {
                DATABASE_BASE_PATH = user ? `${user.uid}` : 'public';
                listeners.clearAll();

                const tasksRef = ref(database, DATABASE_BASE_PATH + '/tasks');

                listeners.track(onValue(tasksRef, (snapshot) => {
                    if (!calendar) return;

                    if (snapshot.exists()) {
                        const tasks = snapshot.val();

                        calendar.getEvents().forEach(event => event.remove());

                        Object.keys(tasks).forEach(id => {
                            const event = formatTaskAsEvent(tasks[id], id);
                            calendar.addEvent(event);
                        });
                    } else {
                        console.log("No tasks found.");
                    }
                }, (error) => {
                    console.error("Firebase read error:", error);
                }));
            });
        }

        function openModalForNewAppointment(dateStr) {
            resetForm();
            document.getElementById('appointmentDate').value = dateStr;
            modal.style.display = "block";
            deleteButton.style.display = 'none';
        }

        function openModalForExistingTask(event) {
            resetForm();
            fillFormWithTaskDetails(event);
            modal.style.display = "block";
            deleteButton.style.display = 'block';
        }

        closeBtn.onclick = () => modal.style.display = "none";
        window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const appointmentData = getFormData();
            saveAppointmentToDatabase(appointmentData);

            modal.style.display = "none";
            form.reset();
        });

        deleteButton.addEventListener('click', function () {
            const id = document.getElementById('id').value;
            if (id && confirm('Are you sure you want to delete this task?')) {
                deleteTask(id);
            }
        });

        function formatTaskAsEvent(task, id) {
            const eventColor = getEventColor(task.invoiceType, task.startTime);
            return {
                id: id,
                title: task.customerName,
                start: task.startTime,
                end: task.endTime,
                backgroundColor: eventColor,
                borderColor: eventColor,
                extendedProps: { ...task }
            };
        }

        function getEventColor(invoiceType, startTime) {
            const taskDate = new Date(startTime);
            const currentDate = new Date();
            if (invoiceType === 'invoice') return 'lightgreen';
            if (invoiceType === 'quote' && taskDate < currentDate) return 'lightcoral';
            return 'lightblue';
        }

        function fillFormWithTaskDetails(event) {
            const { title: customerName, start, extendedProps } = event;
            const { customerAddress, notes, project, id, customerPhone } = extendedProps;

            const startDateTime = new Date(start);
            const localDate = startDateTime.toLocaleDateString('en-CA');
            const localTime = startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            document.getElementById('customerName').value = customerName || '';
            document.getElementById('appointmentDate').value = localDate;
            document.getElementById('appointmentTime').value = localTime;
            document.getElementById('customerAddress').value = customerAddress || '';
            document.getElementById('appointmentNotes').value = notes || '';
            document.getElementById('project').value = project || '';
            document.getElementById('id').value = id || '';
            document.getElementById('customerPhone').value = customerPhone || '';
        }

        function getFormData() {
            const date = document.getElementById('appointmentDate').value;
            const time = document.getElementById('appointmentTime').value;

            const localDateTime = new Date(`${date}T${time}:00`).toISOString();

            return {
                customerName: document.getElementById('customerName').value,
                startTime: localDateTime,
                customerAddress: document.getElementById('customerAddress').value,
                customerPhone: document.getElementById('customerPhone').value,
                notes: document.getElementById('appointmentNotes').value,
                project: document.getElementById('project').value,
                id: document.getElementById('id').value || Date.now().toString()
            };
        }

        function saveAppointmentToDatabase(appointment) {
            const taskRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${appointment.id}`);
            get(taskRef).then(snapshot => {
                const existingTaskData = snapshot.exists() ? snapshot.val() : {};
                const updatedTaskData = { ...existingTaskData, ...appointment, invoiceType: existingTaskData.invoiceType || 'quote' };
                set(taskRef, updatedTaskData).then(() => {
                    console.log('Task saved successfully.');
                });
            }).catch(error => console.error('Error saving task:', error));
        }

        function deleteTask(id) {
            const taskRef = ref(database, `${DATABASE_BASE_PATH}/tasks/${id}`);
            remove(taskRef).then(() => {
                const event = calendar.getEventById(id);
                if (event) event.remove();
                alert('Task deleted successfully.');
                modal.style.display = "none";
            }).catch(error => console.error('Error deleting task:', error));
        }

        function resetForm() {
            form.reset();
            document.getElementById('id').value = '';
        }

        document.getElementById('addressLabel').addEventListener('click', () => {
            const addressInput = document.getElementById('customerAddress');
            const address = addressInput.value.trim();

            if (address) {
                navigator.clipboard.writeText(address)
                    .then(() => {
                        alert('Address copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Error copying address:', err);
                        alert('Failed to copy address.');
                    });
            } else {
                alert('No address to copy.');
            }
        });

        document.getElementById('phoneLabel').addEventListener('click', () => {
            const phoneInput = document.getElementById('customerPhone');
            const phoneNumber = phoneInput.value.trim();

            if (phoneNumber) {
                const tempLink = document.createElement('a');
                tempLink.href = `tel:${phoneNumber}`;
                tempLink.click();
            } else {
                alert('No phone number to call.');
            }
        });
