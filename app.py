from flask import Flask, render_template, request, jsonify, session
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'medical_buddy_secret_key'

# Initialize database
def init_db():
    conn = sqlite3.connect('medical_buddy.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT)''')
    
    # Medical records table
    c.execute('''CREATE TABLE IF NOT EXISTS medical_records
                 (id INTEGER PRIMARY KEY, user_id INTEGER, 
                  condition TEXT, medication TEXT, date_added TEXT,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    # Appointments table
    c.execute('''CREATE TABLE IF NOT EXISTS appointments
                 (id INTEGER PRIMARY KEY, user_id INTEGER,
                  doctor_name TEXT, appointment_date TEXT, notes TEXT,
                  FOREIGN KEY (user_id) REFERENCES users (id))''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        conn = sqlite3.connect('medical_buddy.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (name, email, phone) VALUES (?, ?, ?)",
                  (data['name'], data['email'], data['phone']))
        user_id = c.lastrowid
        conn.commit()
        conn.close()
        session['user_id'] = user_id
        return jsonify({'success': True, 'user_id': user_id})
    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect('/')
    
    user_id = session['user_id']
    conn = sqlite3.connect('medical_buddy.db')
    c = conn.cursor()
    
    # Get user info
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    
    # Get medical records
    c.execute("SELECT * FROM medical_records WHERE user_id = ?", (user_id,))
    records = c.fetchall()
    
    # Get appointments
    c.execute("SELECT * FROM appointments WHERE user_id = ?", (user_id,))
    appointments = c.fetchall()
    
    conn.close()
    return render_template('dashboard.html', user=user, records=records, appointments=appointments)

@app.route('/add_record', methods=['POST'])
def add_record():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.get_json()
    conn = sqlite3.connect('medical_buddy.db')
    c = conn.cursor()
    c.execute("INSERT INTO medical_records (user_id, condition, medication, date_added) VALUES (?, ?, ?, ?)",
              (session['user_id'], data['condition'], data['medication'], datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/add_appointment', methods=['POST'])
def add_appointment():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    data = request.get_json()
    conn = sqlite3.connect('medical_buddy.db')
    c = conn.cursor()
    c.execute("INSERT INTO appointments (user_id, doctor_name, appointment_date, notes) VALUES (?, ?, ?, ?)",
              (session['user_id'], data['doctor_name'], data['appointment_date'], data['notes']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)