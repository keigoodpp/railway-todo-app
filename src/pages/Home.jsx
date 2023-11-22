import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';
import { formatDistanceToNowStrict } from 'date-fns'; // date-fnsライブラリをインポート
import { ja } from 'date-fns/locale'; // 日本語ロケールをインポート

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo');
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);

  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== 'undefined') {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          console.log('Error while fetching tasks:', err); // エラーをコンソールに出力
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  useEffect(() => {
    if (selectListId) {
      axios
        .get(`${url}/lists/${selectListId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          console.log('Error while fetching tasks for selected list:', err);
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [selectListId]); // Dependency array includes selectListId

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.key === 'r' || event.key === 'l') {
        handleKeyDown(event);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [lists, selectListId]);

  const handleKeyDown = (event) => {
    console.log('Key pressed:', event.key); // Debugging line
    const currentIndex = lists.findIndex((list) => list.id === selectListId);

    if (event.key === 'r') {
      // Move to the next list
      const nextIndex = (currentIndex + 1) % lists.length;
      setSelectListId(lists[nextIndex].id);
    } else if (event.key === 'l') {
      // Move to the previous list
      const prevIndex = (currentIndex - 1 + lists.length) % lists.length;
      setSelectListId(lists[prevIndex].id);
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  role="tab"
                  tabIndex={0} // This makes the list items focusable
                  aria-selected={isActive ? 'true' : 'false'}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(e) => handleKeyDown(e, list.id)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 残り時間を計算する関数
const calculateRemainingTime = (deadline) => {
  // 日本標準時に変換するためのオフセット（9時間）
  const JST_OFFSET = -9 * 60 * 60 * 0;

  const now = new Date(); // 現在の日時
  const deadlineDate = new Date(new Date(deadline).getTime() + JST_OFFSET); // 期限日時をJSTに変換

  // 現在の日時から期限日時までのミリ秒数を計算
  const timeDifference = deadlineDate - now;

  if (timeDifference <= 0) {
    // 期限が過ぎている場合は空文字列を返すなどの処理を行う
    return '期限切れ';
  }

  // ミリ秒を日数、時間、分に変換
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24)); // 日数
  const hours = Math.floor(
    (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  ); // 時間
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)); // 分

  return `${days}日${hours}時間${minutes}分後`;
};

// 表示するタスク
const Tasks = ({ tasks, selectListId, isDoneDisplay }) => {
  if (tasks === null) return <></>;

  return (
    <ul>
      {tasks
        .filter((task) => {
          return isDoneDisplay === 'done' ? task.done : !task.done;
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link
              to={`/lists/${selectListId}/tasks/${task.id}`}
              className="task-item-link"
            >
              {task.title}
              <br />
              {task.done ? '完了' : '未完了'}
              <br />
              期限:{' '}
              {task.limit
                ? new Date(
                    new Date(task.limit).getTime() - 9 * 60 * 60 * 0,
                  ).toLocaleString('ja-JP')
                : 'なし'}
              <br />
              残り時間:{' '}
              {task.limit ? calculateRemainingTime(task.limit) : 'なし'}
            </Link>
          </li>
        ))}
    </ul>
  );
};
