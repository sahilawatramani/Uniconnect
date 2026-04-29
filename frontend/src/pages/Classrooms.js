import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Card } from 'antd';
import { HomeOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './CrudPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const Classrooms = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios } = useAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchClassrooms(); }, []);

    const fetchClassrooms = async () => {
        setLoading(true);
        try { const res = await authAxios.get(`${API_URL}/api/classrooms`); setClassrooms(res.data); }
        catch { message.error('Failed to fetch classrooms'); }
        finally { setLoading(false); }
    };

    const columns = [
        { title: 'Classroom ID', dataIndex: 'classroom_id', key: 'id', width: 120 },
        { title: 'Building', dataIndex: 'building', key: 'building' },
        { title: 'Room Number', dataIndex: 'room_number', key: 'room' },
        { title: 'Capacity', dataIndex: 'capacity', key: 'capacity', width: 100 },
        {
            title: 'Actions', key: 'actions', width: 160,
            render: (_, r) => (<>
                <Button className="action-btn edit-btn" onClick={() => handleEdit(r)}>Edit</Button>
                <Button className="action-btn delete-btn" onClick={() => handleDelete(r.classroom_id)}>Delete</Button>
            </>),
        },
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (editingClassroom) {
                await authAxios.put(`${API_URL}/api/classrooms/${editingClassroom.classroom_id}`, values);
                message.success('Classroom updated');
            } else {
                await authAxios.post(`${API_URL}/api/classrooms`, values);
                message.success('Classroom added');
            }
            setIsModalOpen(false); form.resetFields(); setEditingClassroom(null); fetchClassrooms();
        } catch (err) { message.error(err.response?.data?.error || 'Failed to save classroom'); }
    };

    const handleEdit = (room) => {
        form.setFieldsValue(room); setEditingClassroom(room); setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try { await authAxios.delete(`${API_URL}/api/classrooms/${id}`); message.success('Classroom deleted'); fetchClassrooms(); }
        catch { message.error('Failed to delete classroom'); }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #EC4899, #DB2777)' }}><HomeOutlined /></div>
                    <div><h1>Classrooms</h1><p>Manage room allocation</p></div>
                </div>
                <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={() => { setIsModalOpen(true); setEditingClassroom(null); }}>Add Classroom</Button>
            </div>
            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={classrooms} rowKey="classroom_id" loading={loading} pagination={{ pageSize: 10 }} />
                </Card>
            </div>
            <Modal title={editingClassroom ? "Edit Classroom" : "Add Classroom"} open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingClassroom(null); }} onOk={handleAddEdit}>
                <Form form={form} layout="vertical">
                    <Form.Item name="classroom_id" label="Classroom ID" rules={[{ required: true }]}><Input disabled={!!editingClassroom} /></Form.Item>
                    <Form.Item name="building" label="Building" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="room_number" label="Room Number" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Classrooms;
