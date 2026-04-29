import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, message, Card } from 'antd';
import { FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import './CrudPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const Enrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEnrollment, setEditingEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios, isAdmin } = useAuth();

    useEffect(() => { fetchEnrollments(); }, []);

    const fetchEnrollments = async () => {
        setLoading(true);
        try { const res = await authAxios.get(`${API_URL}/api/enrollments`); setEnrollments(res.data); }
        catch { message.error('Failed to fetch enrollments'); }
        finally { setLoading(false); }
    };

    const columns = [
        { title: 'ID', dataIndex: 'enrollment_id', key: 'id', width: 60 },
        { title: 'Student ID', dataIndex: 'student_id', key: 'sid', width: 100 },
        { title: 'Student', dataIndex: 'student_name', key: 'sname' },
        { title: 'Course', dataIndex: 'course_name', key: 'cname' },
        { title: 'Credits', dataIndex: 'credits', key: 'credits', width: 80 },
        { title: 'Grade', dataIndex: 'grade', key: 'grade', width: 80 },
        { title: 'Date', dataIndex: 'enrollment_date', key: 'date', render: d => d ? moment(d).format('YYYY-MM-DD') : '—', width: 120 },
        ...(isAdmin ? [{
            title: 'Actions', key: 'actions', width: 160,
            render: (_, r) => (<>
                <Button className="action-btn edit-btn" onClick={() => handleEdit(r)}>Edit</Button>
                <Button className="action-btn delete-btn" onClick={() => handleDelete(r.enrollment_id)}>Delete</Button>
            </>),
        }] : []),
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (values.enrollment_date) values.enrollment_date = values.enrollment_date.format('YYYY-MM-DD');
            if (editingEnrollment) {
                await authAxios.put(`${API_URL}/api/enrollments/${editingEnrollment.enrollment_id}`, values);
                message.success('Enrollment updated');
            } else {
                await authAxios.post(`${API_URL}/api/enrollments`, values);
                message.success('Enrollment added');
            }
            setIsModalOpen(false); form.resetFields(); setEditingEnrollment(null); fetchEnrollments();
        } catch (err) { message.error(err.response?.data?.error || 'Failed to save enrollment'); }
    };

    const handleEdit = (enrollment) => {
        form.setFieldsValue({
            ...enrollment,
            enrollment_date: enrollment.enrollment_date ? moment(enrollment.enrollment_date) : null
        });
        setEditingEnrollment(enrollment); setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try { await authAxios.delete(`${API_URL}/api/enrollments/${id}`); message.success('Enrollment deleted'); fetchEnrollments(); }
        catch { message.error('Failed to delete enrollment'); }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}><FileTextOutlined /></div>
                    <div><h1>Enrollments</h1><p>{isAdmin ? 'Manage all enrollment records' : 'Your enrolled courses'}</p></div>
                </div>
                {isAdmin && <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={() => { setIsModalOpen(true); setEditingEnrollment(null); }}>Add Enrollment</Button>}
            </div>
            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={enrollments} rowKey="enrollment_id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
                </Card>
            </div>
            {isAdmin && (
                <Modal title={editingEnrollment ? "Edit Enrollment" : "Add Enrollment"} open={isModalOpen}
                    onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingEnrollment(null); }} onOk={handleAddEdit}>
                    <Form form={form} layout="vertical">
                        <Form.Item name="enrollment_id" label="Enrollment ID" rules={[{ required: !editingEnrollment }]}><Input disabled={!!editingEnrollment} /></Form.Item>
                        <Form.Item name="student_id" label="Student ID" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="course_id" label="Course ID" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="enrollment_date" label="Enrollment Date"><DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="grade" label="Grade"><Input /></Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default Enrollments;
