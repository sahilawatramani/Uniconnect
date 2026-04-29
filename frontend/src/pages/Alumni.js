import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message, Card } from 'antd';
import { TeamOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './CrudPage.css';

const API_URL = process.env.REACT_APP_API_URL;

const Alumni = () => {
    const [alumni, setAlumni] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlumni, setEditingAlumni] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form] = Form.useForm();
    const { authAxios } = useAuth();

    useEffect(() => { fetchAlumni(); }, []);

    const fetchAlumni = async () => {
        setLoading(true);
        try { const res = await authAxios.get(`${API_URL}/api/alumni`); setAlumni(res.data); }
        catch { message.error('Failed to fetch alumni'); }
        finally { setLoading(false); }
    };

    const columns = [
        { title: 'Alumni ID', dataIndex: 'alumni_id', key: 'id', width: 100 },
        { title: 'Student ID', dataIndex: 'student_id', key: 'sid', width: 100 },
        { title: 'Graduation Year', dataIndex: 'graduation_year', key: 'year', width: 130 },
        { title: 'Job Title', dataIndex: 'current_job_title', key: 'job' },
        { title: 'Company', dataIndex: 'company', key: 'company' },
        {
            title: 'Actions', key: 'actions', width: 160,
            render: (_, r) => (<>
                <Button className="action-btn edit-btn" onClick={() => handleEdit(r)}>Edit</Button>
                <Button className="action-btn delete-btn" onClick={() => handleDelete(r.alumni_id)}>Delete</Button>
            </>),
        },
    ];

    const handleAddEdit = async () => {
        try {
            const values = await form.validateFields();
            if (editingAlumni) {
                await authAxios.put(`${API_URL}/api/alumni/${editingAlumni.alumni_id}`, values);
                message.success('Alumni updated');
            } else {
                await authAxios.post(`${API_URL}/api/alumni`, values);
                message.success('Alumni added');
            }
            setIsModalOpen(false); form.resetFields(); setEditingAlumni(null); fetchAlumni();
        } catch (err) { message.error(err.response?.data?.error || 'Failed to save alumni'); }
    };

    const handleEdit = (alumni) => {
        form.setFieldsValue(alumni); setEditingAlumni(alumni); setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        try { await authAxios.delete(`${API_URL}/api/alumni/${id}`); message.success('Alumni deleted'); fetchAlumni(); }
        catch { message.error('Failed to delete alumni'); }
    };

    return (
        <div className="crud-page">
            <div className="crud-header">
                <div className="crud-header-left">
                    <div className="crud-header-icon" style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}><TeamOutlined /></div>
                    <div><h1>Alumni</h1><p>Alumni directory</p></div>
                </div>
                <Button type="primary" icon={<PlusOutlined />} className="add-btn" onClick={() => { setIsModalOpen(true); setEditingAlumni(null); }}>Add Alumni</Button>
            </div>
            <div className="crud-body">
                <Card className="crud-table-card">
                    <Table columns={columns} dataSource={alumni} rowKey="alumni_id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} />
                </Card>
            </div>
            <Modal title={editingAlumni ? "Edit Alumni" : "Add Alumni"} open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); form.resetFields(); setEditingAlumni(null); }} onOk={handleAddEdit}>
                <Form form={form} layout="vertical">
                    <Form.Item name="student_id" label="Student ID" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="graduation_year" label="Graduation Year" rules={[{ required: true }]}><InputNumber min={1900} max={2100} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="current_job_title" label="Job Title"><Input /></Form.Item>
                    <Form.Item name="company" label="Company"><Input /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Alumni;
