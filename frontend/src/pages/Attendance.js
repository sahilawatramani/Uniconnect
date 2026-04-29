import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, message, Card, Tag, Progress, Row, Col } from 'antd';
import { CheckCircleOutlined, PlusOutlined, BookOutlined, FilterOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import './CrudPage.css';
import './Attendance.css';

const { Option } = Select;
const API_URL = process.env.REACT_APP_API_URL;

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [summary, setSummary] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios, isAdmin } = useAuth();

    useEffect(() => {
        fetchAttendance();
        if (!isAdmin) fetchSummary();
    }, [selectedSemester]); // eslint-disable-line

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = selectedSemester ? `?semester=${encodeURIComponent(selectedSemester)}` : '';
            const res = await authAxios.get(`${API_URL}/api/attendance${params}`);
            setAttendance(res.data);
        } catch { message.error('Failed to fetch attendance'); }
        finally { setLoading(false); }
    };

    const fetchSummary = async () => {
        try {
            const params = selectedSemester ? `?semester=${encodeURIComponent(selectedSemester)}` : '';
            const res = await authAxios.get(`${API_URL}/api/attendance/summary${params}`);
            setSummary(res.data.subjects || []);
            if (!selectedSemester) setSemesters(res.data.semesters || []);
        } catch (err) {
            console.log('Summary not available');
        }
    };

    // Overall stats for student
    const overallStats = useMemo(() => {
        if (!summary.length) return null;
        const total = summary.reduce((s, r) => s + parseInt(r.total_classes || 0), 0);
        const present = summary.reduce((s, r) => s + parseInt(r.present || 0), 0);
        const absent = summary.reduce((s, r) => s + parseInt(r.absent || 0), 0);
        const late = summary.reduce((s, r) => s + parseInt(r.late || 0), 0);
        const pct = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
        return { total, present, absent, late, pct: parseFloat(pct) };
    }, [summary]);

    const getProgressColor = (pct) => {
        if (pct >= 75) return '#10B981';
        if (pct >= 60) return '#F59E0B';
        return '#EF4444';
    };

    const statusColors = { Present: 'green', Absent: 'red', Late: 'orange' };

    const columns = [
        { title: 'ID', dataIndex: 'attendance_id', key: 'id', width: 60 },
        ...(isAdmin ? [
            { title: 'Student ID', dataIndex: 'student_id', key: 'sid', width: 100 },
            { title: 'Student', dataIndex: 'student_name', key: 'sname' },
        ] : []),
        { title: 'Course', dataIndex: 'course_name', key: 'cname' },
        { title: 'Semester', dataIndex: 'semester', key: 'sem', width: 110 },
        { title: 'Date', dataIndex: 'attendance_date', key: 'date', render: d => d ? moment(d).format('YYYY-MM-DD') : '—', width: 120 },
        {
            title: 'Status', dataIndex: 'status', key: 'status', width: 100,
            render: s => <Tag color={statusColors[s] || 'default'}>{s}</Tag>
        },
        ...(isAdmin ? [{
            title: 'Actions', key: 'actions', width: 160,
            render: (_, r) => (<>
                <Button className="action-btn edit-btn" onClick={() => handleEdit(r)}>Edit</Button>
                <Button className="action-btn delete-btn" onClick={() => handleDelete(r.attendance_id)}>Delete</Button>
            </>),
        }] : []),
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (values.attendance_date) values.attendance_date = values.attendance_date.format('YYYY-MM-DD');
            if (editingRecord) {
                await authAxios.put(`${API_URL}/api/attendance/${editingRecord.attendance_id}`, values);
                message.success('Attendance updated');
            } else {
                await authAxios.post(`${API_URL}/api/attendance`, values);
                message.success('Attendance added');
            }
            setIsModalOpen(false); form.resetFields(); setEditingRecord(null); fetchAttendance();
        } catch (err) { message.error(err.response?.data?.error || 'Failed to save attendance'); }
    };

    const handleEdit = (record) => {
        form.setFieldsValue({
            ...record,
            attendance_date: record.attendance_date ? moment(record.attendance_date) : null
        });
        setEditingRecord(record); setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try { await authAxios.delete(`${API_URL}/api/attendance/${id}`); message.success('Record deleted'); fetchAttendance(); }
        catch { message.error('Failed to delete record'); }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}><CheckCircleOutlined /></div>
                    <div><h1>Attendance</h1><p>{isAdmin ? 'Track all attendance records' : 'Your attendance records'}</p></div>
                </div>
                <div className="crud-header-right">
                    {!isAdmin && semesters.length > 0 && (
                        <Select
                            placeholder="All Semesters"
                            allowClear
                            value={selectedSemester}
                            onChange={(val) => setSelectedSemester(val || null)}
                            style={{ width: 200 }}
                            suffixIcon={<FilterOutlined />}
                            className="semester-filter"
                        >
                            {semesters.map(s => <Option key={s} value={s}>{s}</Option>)}
                        </Select>
                    )}
                    {isAdmin && <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={() => { setIsModalOpen(true); setEditingRecord(null); }}>Add Record</Button>}
                </div>
            </div>

            {/* Student: Subject-wise Summary Cards */}
            {!isAdmin && summary.length > 0 && (
                <div className="crud-body" style={{ paddingBottom: 0 }}>
                    {/* Overall Stats Bar */}
                    {overallStats && (
                        <Card className="overall-stats-card">
                            <Row gutter={24} align="middle">
                                <Col flex="auto">
                                    <div className="overall-label">Overall Attendance</div>
                                    <Progress
                                        percent={overallStats.pct}
                                        strokeColor={getProgressColor(overallStats.pct)}
                                        trailColor="rgba(255,255,255,0.08)"
                                        size="small"
                                    />
                                </Col>
                                <Col><div className="stat-pill present">{overallStats.present} <span>Present</span></div></Col>
                                <Col><div className="stat-pill absent">{overallStats.absent} <span>Absent</span></div></Col>
                                <Col><div className="stat-pill late">{overallStats.late} <span>Late</span></div></Col>
                                <Col><div className="stat-pill total">{overallStats.total} <span>Total</span></div></Col>
                            </Row>
                        </Card>
                    )}

                    {/* Per-Subject Cards */}
                    <div className="subject-grid">
                        {summary.map((sub, i) => {
                            const pct = parseFloat(sub.percentage || 0);
                            return (
                                <Card key={sub.course_id || i} className="subject-card" hoverable>
                                    <div className="subject-card-header">
                                        <div className="subject-icon"><BookOutlined /></div>
                                        <div className="subject-info">
                                            <h4>{sub.course_name || sub.course_id}</h4>
                                            <span className="subject-semester">{sub.semester || '—'}</span>
                                        </div>
                                    </div>
                                    <Progress
                                        percent={pct}
                                        strokeColor={getProgressColor(pct)}
                                        trailColor="rgba(255,255,255,0.08)"
                                        format={p => <span style={{ color: getProgressColor(pct), fontWeight: 700 }}>{p}%</span>}
                                    />
                                    <div className="subject-stats">
                                        <span className="s-present">✓ {sub.present}</span>
                                        <span className="s-absent">✗ {sub.absent}</span>
                                        <span className="s-late">⏱ {sub.late}</span>
                                        <span className="s-total">/ {sub.total_classes}</span>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={attendance} rowKey="attendance_id" loading={loading} pagination={{ pageSize: 15 }} scroll={{ x: 800 }} />
                </Card>
            </div>

            {isAdmin && (
                <Modal title={editingRecord ? "Edit Attendance" : "Add Attendance"} open={isModalOpen}
                    onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingRecord(null); }} onOk={handleAddEdit}>
                    <Form form={form} layout="vertical">
                        <Form.Item name="student_id" label="Student ID" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="course_id" label="Course ID" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="attendance_date" label="Date" rules={[{ required: true }]}>
                            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                            <Select>
                                <Option value="Present">Present</Option>
                                <Option value="Absent">Absent</Option>
                                <Option value="Late">Late</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default Attendance;
