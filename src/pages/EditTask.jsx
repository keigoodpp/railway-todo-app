import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import { url } from '../const';
import { useNavigate, useParams } from 'react-router-dom';
import './editTask.scss';

export const EditTask = () => {
  const history = useNavigate();
  const { listId, taskId } = useParams();
  const [cookies] = useCookies();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [utcTimeForDisplay, setUtcTimeForDisplay] = useState(''); // ユーザーに表示するためのUTC日時
  const [deadline, setDeadline] = useState(''); // PUTリクエストで使用する完全なUTC日時
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleDetailChange = (e) => setDetail(e.target.value);
  const handleIsDoneChange = (e) => setIsDone(e.target.value === 'done');

  const handleDeadlineChange = (e) => {
    const localTime = new Date(e.target.value);
    const offset = localTime.getTimezoneOffset() * 60000;
    const utcTime = new Date(localTime.getTime() - offset).toISOString();
    const deadline = new Date(localTime.getTime()).toISOString();
    setUtcTimeForDisplay(utcTime.slice(0, 16)); // 表示用のUTC日時
    setDeadline(deadline); // PUTリクエストで使用する完全なUTC日時
  };

  // PUTリクエストを送信する際には完全なUTC日時を使用
  const onUpdateTask = () => {
    const data = {
      title: title,
      detail: detail,
      done: isDone,
      limit: deadline, // 完全なUTC日時を使用
    };

    axios
      .put(`${url}/lists/${listId}/tasks/${taskId}`, data, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        history('/');
      })
      .catch((err) => {
        setErrorMessage(`更新に失敗しました。${err}`);
      });
  };

  const onDeleteTask = () => {
    axios
      .delete(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then(() => {
        history('/');
      })
      .catch((err) => {
        setErrorMessage(`削除に失敗しました。${err}`);
      });
  };

  useEffect(() => {
    axios
      .get(`${url}/lists/${listId}/tasks/${taskId}`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        const task = res.data;
        setTitle(task.title);
        setDetail(task.detail);
        setIsDone(task.done);

        // UTC日時をローカル日時に変換
        if (task.limit) {
          const utcDate = new Date(task.limit);
          const localDate = new Date(
            utcDate.getTime() - utcDate.getTimezoneOffset() * 60000,
          );
          const formattedDate = localDate.toISOString().slice(0, 16); // yyyy-MM-ddThh:mm 形式に変換
          const deadline = new Date(
            utcDate.getTime() - utcDate.getTimezoneOffset() * 0,
          );
          setUtcTimeForDisplay(formattedDate); // 表示用のUTC日時を設定
          setDeadline(deadline.toISOString()); // 完全なUTC日時を設定
        } else {
          setDeadline('');
        }
      })
      .catch((err) => {
        setErrorMessage(`タスク情報の取得に失敗しました。${err}`);
      });
  }, []);

  return (
    <div>
      <Header />
      <main className="edit-task">
        <h2>タスク編集</h2>
        <p className="error-message">{errorMessage}</p>
        <form className="edit-task-form">
          <label>タイトル</label>
          <br />
          <input
            type="text"
            onChange={handleTitleChange}
            className="edit-task-title"
            value={title}
          />
          <br />
          <label>詳細</label>
          <br />
          <textarea
            onChange={handleDetailChange}
            className="edit-task-detail"
            value={detail}
          />
          <br />
          <label>期限日時</label>
          <br />
          <input
            type="datetime-local"
            onChange={handleDeadlineChange}
            className="edit-task-deadline"
            value={utcTimeForDisplay} // 表示用のUTC日時を表示
          />
          <br />
          <div>
            <input
              type="radio"
              id="todo"
              name="status"
              value="todo"
              onChange={handleIsDoneChange}
              checked={!isDone}
            />
            未完了
            <input
              type="radio"
              id="done"
              name="status"
              value="done"
              onChange={handleIsDoneChange}
              checked={isDone}
            />
            完了
          </div>
          <button
            type="button"
            className="delete-task-button"
            onClick={onDeleteTask}
          >
            削除
          </button>
          <button
            type="button"
            className="edit-task-button"
            onClick={onUpdateTask}
          >
            更新
          </button>
        </form>
      </main>
    </div>
  );
};
