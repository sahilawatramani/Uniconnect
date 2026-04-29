import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Card } from 'antd';
import { BookOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './CrudPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios, isAdmin } = useAuth();

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get(`${API_URL}/api/courses`);
            setCourses(res.data);
        } catch { message.error('Failed to fetch courses'); }
        finally { setLoading(false); }
    };

    const columns = [
        { title: 'Course ID', dataIndex: 'course_id', key: 'course_id', width: 110 },
        { title: 'Course Name', dataIndex: 'course_name', key: 'course_name' },
        { title: 'Credits', dataIndex: 'credits', key: 'credits', width: 80 },
        { title: 'Dept ID', dataIndex: 'department_id', key: 'dept', width: 80 },
        { title: 'Semester', dataIndex: 'semester', key: 'semester', width: 100 },
        ...(isAdmin ? [{
            title: 'Actions', key: 'actions', width: 160,
            render: (_, r) => (<>
                <Button className="action-btn edit-btn" onClick={() => handleEdit(r)}>Edit</Button>
                <Button className="action-btn delete-btn" onClick={() => handleDelete(r.course_id)}>Delete</Button>
            </>),
        }] : []),
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (editingCourse) {
                await authAxios.put(`${API_URL}/api/courses/${editingCourse.course_id}`, values);
                message.success('Course updated');
            } else {
                await authAxios.post(`${API_URL}/api/courses`, values);
                message.success('Course added');
            }
            setIsModalOpen(false); form.resetFields(); setEditingCourse(null); fetchCourses();
        } catch (err) { message.error(err.response?.data?.error || 'Failed to save course'); }
    };

    const handleEdit = (course) => {
        form.setFieldsValue(course); setEditingCourse(course); setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try { await authAxios.delete(`${API_URL}/api/courses/${id}`); message.success('Course deleted'); fetchCourses(); }
        catch { message.error('Failed to delete course'); }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}><BookOutlined /></div>
                    <div><h1>Courses</h1><p>Browse and manage courses</p></div>
                </div>
                {isAdmin && <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={() => { setIsModalOpen(true); setEditingCourse(null); }}>Add Course</Button>}
            </div>
            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={courses} rowKey="course_id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 700 }} />
                </Card>
            </div>
            {isAdmin && (
                <Modal title={editingCourse ? "Edit Course" : "Add Course"} open={isModalOpen} onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingCourse(null); }} onOk={handleAddEdit}>
                    <Form form={form} layout="vertical">
                        <Form.Item name="course_id" label="Course ID" rules={[{ required: true }]}><Input disabled={!!editingCourse} /></Form.Item>
                        <Form.Item name="course_name" label="Course Name" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="credits" label="Credits" rules={[{ required: true }]}><InputNumber min={1} max={10} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="department_id" label="Department ID" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                        <Form.Item name="semester" label="Semester" rules={[{ required: true }]}><Input /></Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default Courses;
