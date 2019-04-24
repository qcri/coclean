import pandas as pd
import qgrid.grid

from ipywidgets.widgets import Button, VBox, HBox


class CollaborativeDataFrame(pd.DataFrame):
    def __init__(self, data):        
        if isinstance(data, pd.DataFrame):
            # TODO upload data and get unique id
            df = data
        elif isinstance(data, str):
            # TODO fetch the data from url.
            df = pd.read_csv(data)
            
        else:
            raise ValueError('data must be either a DataFrame instance to be shared, or a string id of a previously shared DataFrame.')

        pd.DataFrame.__init__(self, df)
        self.df = df
        self.setup_widget()

        

    def setup_widget(self):
        ### grid widget construction:
        grid_widget = qgrid.show_grid(self.df)
        def handle_cell_edited(event, grid_widget):
            index, column, new_value = event['index'], event['column'], event['new']
            self.loc[index, column] = new_value 

        grid_widget.on('cell_edited', handle_cell_edited)
        self.grid_widget = grid_widget
        

        #refresh button
        refresh_button = Button(description='Refresh')
        def refresh(button):
            self.grid_widget.df = self

        refresh_button.on_click(refresh)

        #commit button
        commit_button = Button(description='Commit')
        def commit(button):
            print('will commit')

        commit_button.on_click(commit)

        def get_widget():
            refresh(None)
            return VBox([
                        HBox([
                                refresh_button,
                                commit_button
                        ]),
                        grid_widget
                ])
        self.get_widget = get_widget






## sest up dispaly for ipython notebooks
try:
    from IPython.core.getipython import get_ipython
    from IPython.display import display
except ImportError:
    raise ImportError('This feature requires IPython 1.0+')

get_ipython().display_formatter.ipython_display_formatter.for_type(CollaborativeDataFrame, lambda cdf: display(cdf.get_widget()))
