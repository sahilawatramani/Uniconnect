import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, InputNumber, message, Card } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import './CrudPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const Students = () => {
    const [students, setStudents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios, isAdmin } = useAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await authAxios.get(`${API_URL}/api/students`);
            setStudents(response.data);
        } catch (error) {
            message.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Student ID', dataIndex: 'student_id', key: 'student_id', width: 110 },
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'DOB', dataIndex: 'date_of_birth', key: 'dob', render: d => d ? moment(d).format('YYYY-MM-DD') : '—', width: 120 },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Phone', dataIndex: 'phone_number', key: 'phone', width: 130 },
        { title: 'Year', dataIndex: 'admission_year', key: 'year', width: 80 },
        { title: 'Dept ID', dataIndex: 'department_id', key: 'dept', width: 80 },
        ...(isAdmin ? [{
            title: 'Actions', key: 'actions', width: 160,
            render: (_, record) => (
                <>
                    <Button className="action-btn edit-btn" onClick={() => handleEdit(record)}>Edit</Button>
                    <Button className="action-btn delete-btn" onClick={() => handleDelete(record.student_id)}>Delete</Button>
                </>
            ),
        }] : []),
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (values.date_of_birth) values.date_of_birth = values.date_of_birth.format('YYYY-MM-DD');

            if (editingStudent) {
                await authAxios.put(`${API_URL}/api/students/${editingStudent.student_id}`, values);
                message.success('Student updated');
            } else {
                await authAxios.post(`${API_URL}/api/students`, values);
                message.success('Student added');
            }
            setIsModalOpen(false);
            form.resetFields();
            setEditingStudent(null);
            fetchStudents();
        } catch (error) {
            message.error(error.response?.data?.error || 'Failed to save student');
        }
    };

    const handleEdit = (student) => {
        form.setFieldsValue({ ...student, date_of_birth: moment(student.date_of_birth) });
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await authAxios.delete(`${API_URL}/api/students/${id}`);
            message.success('Student deleted');
            fetchStudents();
        } catch (error) {
            message.error('Failed to delete student');
        }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #06B6D4, #0891B2)' }}>
                        <UserOutlined />
                    </div>
                    <div>
                        <h1>Students</h1>
                        <p>{isAdmin ? 'Manage all student records' : 'Your student profile'}</p>
                    </div>
                </div>
                {isAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} className="add-btn"
                        onClick={() => { setIsModalOpen(true); setEditingStudent(null); }}>
                        Add Student
                    </Button>
                )}
            </div>

            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={students} rowKey="student_id"
                        loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
                </Card>
            </div>

            {isAdmin && (
                <Modal title={editingStudent ? "Edit Student" : "Add Student"} open={isModalOpen}
                    onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingStudent(null); }}
                    onOk={handleAddEdit}>
                    <Form form={form} layout="vertical">
                        <Form.Item name="student_id" label="Student ID" rules={[{ required: true }]}>
                            <Input disabled={!!editingStudent} />
                        </Form.Item>
                        <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="date_of_birth" label="Date of Birth" rules={[{ required: true }]}>
                            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                        <Form.Item name="phone_number" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="admission_year" label="Admission Year" rules={[{ required: true }]}>
                            <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="department_id" label="Department ID" rules={[{ required: true }]}>
                            <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default Students;
